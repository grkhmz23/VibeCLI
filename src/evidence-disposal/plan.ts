import { join } from "node:path";
import { sha256File } from "../ledger/hash.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists, readJson } from "../utils/fs.js";
import { appendRetentionLedgerEvent } from "../evidence-lifecycle/retention-ledger.js";
import { loadDisposalConfig } from "./config.js";
import { evaluateDisposalEligibility } from "./expiry.js";
import { buildDisposalCandidates } from "./candidates.js";
import { updateEvidenceDisposalState } from "./state.js";
import type { DisposalAttestation, DisposalCandidates, DisposalPlan } from "./types.js";

export async function createDisposalPlan(
  cwd: string,
  runId: string,
  options: { forcePreview?: boolean } = {}
): Promise<DisposalPlan> {
  const config = await loadDisposalConfig(cwd);
  const store = new RunStore(cwd);
  const runPath = store.runPath(runId);
  const eligibility = await evaluateDisposalEligibility(cwd, runId);
  const candidates = await readOrBuildCandidates(cwd, runId);
  const attestationPath = join(
    runPath,
    "evidence-lifecycle",
    "disposal",
    "DISPOSAL_ATTESTATION.json"
  );
  const attestation = pathExists(attestationPath)
    ? await readJson<DisposalAttestation>(attestationPath).catch(() => undefined)
    : undefined;
  const requirements: DisposalPlan["preDeleteRequirements"] = [
    {
      name: "retention_expired",
      required: config.require_retention_expired,
      satisfied: !config.require_retention_expired || eligibility.retention.expired,
      message: eligibility.retention.expired ? "Retention expired." : "Retention is not expired."
    },
    {
      name: "no_legal_hold",
      required: config.require_no_legal_hold,
      satisfied: !config.require_no_legal_hold || !eligibility.retention.legalHold,
      message: eligibility.retention.legalHold
        ? "Legal hold blocks disposal."
        : "No active legal hold."
    },
    {
      name: "archive_verified",
      required: config.require_archive_verified,
      satisfied: !config.require_archive_verified || eligibility.archive.verified,
      message: eligibility.archive.verified ? "Archive verified." : "Archive is missing or invalid."
    },
    {
      name: "ledger_verified",
      required: config.require_retention_ledger,
      satisfied: !config.require_retention_ledger || eligibility.ledger.verified,
      message: eligibility.ledger.verified
        ? "Ledgers verified."
        : "Ledger verification is not passing."
    },
    {
      name: "org_disposal_approval",
      required: config.require_org_approval,
      satisfied: !config.require_org_approval || eligibility.organizationApproval.status === "met",
      message:
        eligibility.organizationApproval.status === "met"
          ? "Disposal approval quorum met."
          : "Disposal approval quorum is missing."
    },
    {
      name: "disposal_attestation",
      required: config.require_disposal_attestation,
      satisfied: !config.require_disposal_attestation || Boolean(attestation),
      message: attestation ? "Disposal attestation present." : "Disposal attestation is missing."
    }
  ];
  const gatesPass = requirements.every(
    (requirement) => !requirement.required || requirement.satisfied
  );
  const blockedReasons = [...eligibility.blockingReasons];
  if (config.require_disposal_attestation && !attestation)
    blockedReasons.push("Disposal attestation is missing.");
  const status =
    gatesPass && eligibility.eligible
      ? candidates.warnings.length > 0
        ? "ready_with_warnings"
        : "ready"
      : "blocked";
  const plan: DisposalPlan = {
    runId,
    createdAt: new Date().toISOString(),
    status: options.forcePreview ? (status === "blocked" ? "ready_with_warnings" : status) : status,
    scope: "run-evidence-only",
    eligibility: { eligible: eligibility.eligible, blockingReasons: blockedReasons },
    preDeleteRequirements: requirements,
    candidates: candidates.candidates.map((candidate) => ({
      path: candidate.path,
      sha256: candidate.sha256,
      sizeBytes: candidate.sizeBytes,
      class: candidate.class,
      reason: candidate.reason
    })),
    blocked: candidates.blocked.map((entry) => ({ path: entry.path, reason: entry.reason })),
    estimatedBytesToDelete: candidates.summary.candidateBytes,
    estimatedFilesToDelete: candidates.summary.candidateFiles,
    exactConfirmation: `DELETE EVIDENCE ${runId}`,
    warnings: [
      "Recovery is not guaranteed. Review RECOVERY_GUIDANCE.md after exact-confirmed local disposal.",
      ...candidates.warnings
    ],
    nextActions:
      status === "blocked"
        ? [`Resolve pre-delete gates, then run vibe disposal-plan ${runId}`]
        : [`vibe disposal-precheck ${runId}`, `vibe disposal-execute ${runId} --dry-run`]
  };
  await store.writeArtifact(runId, "evidence-lifecycle/disposal/DISPOSAL_PLAN.json", plan);
  await store.writeTextArtifact(
    runId,
    "evidence-lifecycle/disposal/DISPOSAL_PLAN.md",
    renderPlan(plan)
  );
  const planHash = await sha256File(
    join(runPath, "evidence-lifecycle", "disposal", "DISPOSAL_PLAN.json")
  ).catch(() => undefined);
  await updateEvidenceDisposalState(store, runId, (state) => {
    state.plan = {
      status: plan.status,
      estimatedFilesToDelete: plan.estimatedFilesToDelete,
      estimatedBytesToDelete: plan.estimatedBytesToDelete
    };
  });
  await writeLedgerManifest(cwd, runId).catch(() => undefined);
  await appendRetentionLedgerEvent(cwd, {
    eventType: "disposal_plan_created",
    runId,
    actor: null,
    summary: `Disposal plan ${plan.status}.`,
    artifactHashes: planHash
      ? [
          {
            path: `.vibecli/runs/${runId}/evidence-lifecycle/disposal/DISPOSAL_PLAN.json`,
            sha256: planHash.sha256
          }
        ]
      : []
  }).catch(() => undefined);
  return plan;
}

async function readOrBuildCandidates(cwd: string, runId: string): Promise<DisposalCandidates> {
  const path = join(
    new RunStore(cwd).runPath(runId),
    "evidence-lifecycle",
    "disposal",
    "DISPOSAL_CANDIDATES.json"
  );
  return pathExists(path)
    ? readJson<DisposalCandidates>(path)
    : buildDisposalCandidates(cwd, runId);
}

function renderPlan(plan: DisposalPlan): string {
  return `# Disposal Plan

Run id: ${plan.runId}
Status: ${plan.status}
Scope: ${plan.scope}
Estimated files to delete: ${plan.estimatedFilesToDelete}
Estimated bytes to delete: ${plan.estimatedBytesToDelete}
Exact confirmation: ${plan.exactConfirmation}

Pre-delete requirements:
${plan.preDeleteRequirements.map((entry) => `- ${entry.name}: ${entry.satisfied ? "satisfied" : "not satisfied"} (${entry.message})`).join("\n")}

No evidence was deleted.
`;
}
