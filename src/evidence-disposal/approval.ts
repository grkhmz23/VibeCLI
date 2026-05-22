import { join } from "node:path";
import { loadConfig } from "../config/config.js";
import { sha256File, sha256Text } from "../ledger/hash.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { appendRetentionLedgerEvent } from "../evidence-lifecycle/retention-ledger.js";
import { redactEvidenceText } from "../evidence-lifecycle/redaction.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists, readJson } from "../utils/fs.js";
import { createDisposalPlan } from "./plan.js";
import { updateEvidenceDisposalState } from "./state.js";
import type { DisposalApprovals } from "./types.js";

export async function getDisposalApprovals(cwd: string, runId: string): Promise<DisposalApprovals> {
  const path = approvalPath(cwd, runId);
  if (pathExists(path)) return readJson<DisposalApprovals>(path);
  return writeDisposalApprovals(cwd, runId, []);
}

export async function addDisposalApproval(
  cwd: string,
  runId: string,
  options: {
    reviewer?: string;
    role?: string;
    decision?: "approved" | "rejected" | "needs_changes";
    note?: string;
    confirm?: string;
    externalReviewer?: boolean;
  }
): Promise<DisposalApprovals> {
  if (options.confirm !== `ADD DISPOSAL APPROVAL ${runId}`) {
    throw new Error(
      `Disposal approval requires exact confirmation: ADD DISPOSAL APPROVAL ${runId}`
    );
  }
  if (!options.reviewer || !options.role || !options.decision || !options.note) {
    throw new Error("Disposal approval requires reviewer, role, decision, and note.");
  }
  const config = await loadConfig(cwd);
  const reviewer = config.organization.reviewers.find((entry) => entry.id === options.reviewer);
  if (!options.externalReviewer && !reviewer)
    throw new Error(`Reviewer not found: ${options.reviewer}`);
  if (!options.externalReviewer && !reviewer?.roles.includes(options.role)) {
    throw new Error(`Reviewer ${options.reviewer} does not have role ${options.role}`);
  }
  await createDisposalPlan(cwd, runId, { forcePreview: true });
  const store = new RunStore(cwd);
  const runPath = store.runPath(runId);
  const planSha256 = (
    await sha256File(join(runPath, "evidence-lifecycle", "disposal", "DISPOSAL_PLAN.json"))
  ).sha256;
  const candidateSha256 = (
    await sha256File(join(runPath, "evidence-lifecycle", "disposal", "DISPOSAL_CANDIDATES.json"))
  ).sha256;
  const current = await getDisposalApprovals(cwd, runId);
  const createdAt = new Date().toISOString();
  const payload = {
    createdAt,
    reviewerId: options.reviewer,
    role: options.role,
    decision: options.decision,
    noteHash: sha256Text(redactEvidenceText(options.note, 500)),
    planSha256,
    candidateSha256
  };
  const approvals = [
    ...current.approvals,
    {
      id: `disposal-approval-${current.approvals.length + 1}`,
      createdAt,
      reviewerId: options.reviewer,
      reviewerDisplayName: reviewer?.display_name ?? options.reviewer,
      role: options.role,
      decision: options.decision,
      noteHash: payload.noteHash,
      planSha256,
      candidateSha256,
      signature: {
        algorithm: "sha256-local" as const,
        payloadHash: sha256Text(JSON.stringify(payload))
      }
    }
  ];
  const result = await writeDisposalApprovals(cwd, runId, approvals);
  await appendRetentionLedgerEvent(cwd, {
    eventType: "disposal_approval_added",
    runId,
    actor: options.reviewer,
    summary: `Disposal approval ${options.decision} recorded.`,
    artifactHashes: []
  }).catch(() => undefined);
  await writeLedgerManifest(cwd, runId).catch(() => undefined);
  return result;
}

export async function verifyDisposalApprovals(
  cwd: string,
  runId: string
): Promise<{ ok: boolean; message: string; approvals: DisposalApprovals }> {
  const approvals = await getDisposalApprovals(cwd, runId);
  const runPath = new RunStore(cwd).runPath(runId);
  const planSha256 = pathExists(
    join(runPath, "evidence-lifecycle", "disposal", "DISPOSAL_PLAN.json")
  )
    ? (await sha256File(join(runPath, "evidence-lifecycle", "disposal", "DISPOSAL_PLAN.json")))
        .sha256
    : "";
  const candidateSha256 = pathExists(
    join(runPath, "evidence-lifecycle", "disposal", "DISPOSAL_CANDIDATES.json")
  )
    ? (
        await sha256File(
          join(runPath, "evidence-lifecycle", "disposal", "DISPOSAL_CANDIDATES.json")
        )
      ).sha256
    : "";
  const ok = approvals.approvals.every(
    (approval) => approval.planSha256 === planSha256 && approval.candidateSha256 === candidateSha256
  );
  return { ok, message: ok ? "approvals verified" : "approval artifact hash mismatch", approvals };
}

async function writeDisposalApprovals(
  cwd: string,
  runId: string,
  approvals: DisposalApprovals["approvals"]
): Promise<DisposalApprovals> {
  const config = await loadConfig(cwd);
  const policyName = config.organization.default_approval_policy;
  const policy = config.organization.approval_policies[policyName] ?? {
    min_approvals: 1,
    required_roles: ["release_manager"],
    require_distinct_reviewers: true,
    allow_needs_changes: false
  };
  const approved = approvals.filter((entry) => entry.decision === "approved");
  const rejected = approvals.filter((entry) => entry.decision === "rejected");
  const needsChanges = approvals.filter((entry) => entry.decision === "needs_changes");
  const roles = new Set(approved.map((entry) => entry.role));
  const missingRoles = policy.required_roles.filter((role) => !roles.has(role));
  const distinctReviewerCount = new Set(approved.map((entry) => entry.reviewerId)).size;
  const blockingReasons = [
    ...rejected.map((entry) => `Rejected by ${entry.reviewerId}.`),
    ...(policy.allow_needs_changes
      ? []
      : needsChanges.map((entry) => `Needs changes from ${entry.reviewerId}.`)),
    ...missingRoles.map((role) => `Missing required role ${role}.`)
  ];
  if (approved.length < policy.min_approvals) blockingReasons.push("Minimum approvals not met.");
  if (
    policy.require_distinct_reviewers &&
    distinctReviewerCount < Math.min(policy.min_approvals, approved.length || policy.min_approvals)
  ) {
    blockingReasons.push("Distinct reviewer requirement is not met.");
  }
  const result: DisposalApprovals = {
    runId,
    createdAt: new Date().toISOString(),
    approvalPolicy: policyName,
    minApprovals: policy.min_approvals,
    requiredRoles: policy.required_roles,
    requireDistinctReviewers: policy.require_distinct_reviewers,
    approvals,
    quorum: {
      status: blockingReasons.some((reason) => /^Rejected|^Needs changes/.test(reason))
        ? "blocked"
        : blockingReasons.length === 0
          ? "met"
          : "not_met",
      approvedCount: approved.length,
      distinctReviewerCount,
      missingRoles,
      blockingReasons,
      warnings: ["Disposal approvals are local integrity records and do not delete evidence."]
    }
  };
  const store = new RunStore(cwd);
  await store.writeArtifact(runId, "evidence-lifecycle/disposal/DISPOSAL_APPROVALS.json", result);
  await store.writeTextArtifact(
    runId,
    "evidence-lifecycle/disposal/DISPOSAL_APPROVALS.md",
    renderApprovals(result)
  );
  await updateEvidenceDisposalState(store, runId, (state) => {
    state.approvals = {
      status:
        result.quorum.status === "met"
          ? "met"
          : result.quorum.status === "blocked"
            ? "blocked"
            : "not_met"
    };
  });
  return result;
}

function approvalPath(cwd: string, runId: string): string {
  return join(
    new RunStore(cwd).runPath(runId),
    "evidence-lifecycle",
    "disposal",
    "DISPOSAL_APPROVALS.json"
  );
}

function renderApprovals(approvals: DisposalApprovals): string {
  return `# Disposal Approvals

Run id: ${approvals.runId}
Policy: ${approvals.approvalPolicy}
Quorum: ${approvals.quorum.status}
Approved count: ${approvals.quorum.approvedCount}

No evidence was deleted.
`;
}
