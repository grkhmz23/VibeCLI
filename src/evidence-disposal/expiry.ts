import { join } from "node:path";
import { loadDisposalConfig } from "./config.js";
import type { DisposalEligibility } from "./types.js";
import { verifyEvidenceArchive } from "../evidence-lifecycle/archive-verify.js";
import { readArchiveManifest } from "../evidence-lifecycle/archive.js";
import { verifyRetentionLedger } from "../evidence-lifecycle/retention-ledger-verify.js";
import { verifyLedger } from "../ledger/verify.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists, readJson } from "../utils/fs.js";
import { updateEvidenceDisposalState } from "./state.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { appendRetentionLedgerEvent } from "../evidence-lifecycle/retention-ledger.js";

type RetentionLike = {
  policy?: string;
  retainUntil?: string | null;
  legalHold?: boolean;
};

export async function evaluateDisposalEligibility(
  cwd: string,
  runId: string,
  options: { policy?: string } = {}
): Promise<DisposalEligibility> {
  const config = await loadDisposalConfig(cwd);
  const store = new RunStore(cwd);
  const runPath = store.runPath(runId);
  const retentionPath = join(runPath, "org", "RETENTION_MARKER.json");
  const planPath = join(runPath, "org", "RETENTION_PLAN.json");
  const emptyRetention: RetentionLike = {};
  const retention: RetentionLike = pathExists(retentionPath)
    ? await readJson<RetentionLike>(retentionPath).catch(() => emptyRetention)
    : pathExists(planPath)
      ? await readJson<RetentionLike>(planPath).catch(() => emptyRetention)
      : emptyRetention;
  const legalHoldPath = join(runPath, "evidence-lifecycle", "LEGAL_HOLD.json");
  const legalHoldRecord = pathExists(legalHoldPath)
    ? await readJson<{ status: "enabled" | "released" }>(legalHoldPath).catch(() => undefined)
    : undefined;
  const legalHoldEnabled = legalHoldRecord?.status === "enabled" || retention.legalHold === true;
  const retainUntil = retention.retainUntil ?? null;
  const expired = retainUntil ? Date.parse(retainUntil) <= Date.now() : false;
  let archivePresent = false;
  let archiveVerified = false;
  let archivePath: string | null = null;
  try {
    const manifest = await readArchiveManifest(cwd, runId);
    archivePresent = true;
    archivePath = manifest.archivePath;
    archiveVerified = (await verifyEvidenceArchive(cwd, runId)).ok;
  } catch {
    archivePresent = false;
  }
  const retentionLedger = config.require_retention_ledger
    ? await verifyRetentionLedger(cwd, runId).catch(() => ({ ok: false }))
    : { ok: true };
  await writeLedgerManifest(cwd, runId).catch(() => undefined);
  const runLedger = await verifyLedger(cwd, runId).catch(() => ({ ok: false }));
  const approval = await readApprovalStatus(cwd, runId);
  const blockingReasons: string[] = [];
  if (config.require_retention_expired && !expired)
    blockingReasons.push("Retention has not expired.");
  if (config.require_retention_expired && !retainUntil)
    blockingReasons.push("Retention marker is missing.");
  if (config.require_no_legal_hold && legalHoldEnabled)
    blockingReasons.push("Legal hold is enabled.");
  if (config.require_archive_verified && !archivePresent)
    blockingReasons.push("Verified archive is missing.");
  if (config.require_archive_verified && archivePresent && !archiveVerified) {
    blockingReasons.push("Evidence archive verification failed.");
  }
  if (config.require_retention_ledger && (!retentionLedger.ok || !runLedger.ok)) {
    blockingReasons.push("Retention or run ledger verification failed.");
  }
  if (config.require_org_approval && approval !== "met") {
    blockingReasons.push("Organization disposal approval quorum is missing.");
  }
  const result: DisposalEligibility = {
    runId,
    createdAt: new Date().toISOString(),
    eligible: blockingReasons.length === 0,
    retention: {
      policy: options.policy ?? retention.policy ?? null,
      retainUntil,
      expired,
      legalHold: legalHoldEnabled,
      legalHoldStatus: legalHoldRecord?.status ?? (retention.legalHold ? "enabled" : "none")
    },
    archive: {
      required: config.require_archive_verified,
      present: archivePresent,
      verified: archiveVerified,
      archivePath
    },
    ledger: {
      required: config.require_retention_ledger,
      verified: Boolean(retentionLedger.ok && runLedger.ok)
    },
    organizationApproval: {
      required: config.require_org_approval,
      status: config.require_org_approval ? approval : "not_required"
    },
    blockingReasons,
    warnings: ["Disposal eligibility is a local preview. No evidence was deleted."],
    nextActions:
      blockingReasons.length === 0
        ? [`vibe disposal-candidates ${runId}`, `vibe disposal-plan ${runId}`]
        : [`Resolve blocking reasons, then run vibe disposal-eligibility ${runId}`]
  };
  await store.writeArtifact(runId, "evidence-lifecycle/disposal/DISPOSAL_ELIGIBILITY.json", result);
  await store.writeTextArtifact(
    runId,
    "evidence-lifecycle/disposal/DISPOSAL_ELIGIBILITY.md",
    renderEligibility(result)
  );
  await updateEvidenceDisposalState(store, runId, (state) => {
    state.eligibility = {
      status: result.eligible ? "eligible" : "blocked",
      checkedAt: result.createdAt
    };
  });
  await writeLedgerManifest(cwd, runId).catch(() => undefined);
  await appendRetentionLedgerEvent(cwd, {
    eventType: "disposal_eligibility_checked",
    runId,
    actor: null,
    summary: result.eligible ? "Disposal eligibility passed." : "Disposal eligibility blocked.",
    artifactHashes: []
  }).catch(() => undefined);
  return result;
}

async function readApprovalStatus(
  cwd: string,
  runId: string
): Promise<"missing" | "met" | "blocked" | "unknown"> {
  const path = join(
    new RunStore(cwd).runPath(runId),
    "evidence-lifecycle",
    "disposal",
    "DISPOSAL_APPROVALS.json"
  );
  if (!pathExists(path)) return "missing";
  const approvals = await readJson<{ quorum?: { status?: string } }>(path).catch(() => undefined);
  return approvals?.quorum?.status === "met"
    ? "met"
    : approvals?.quorum?.status === "blocked"
      ? "blocked"
      : "missing";
}

function renderEligibility(result: DisposalEligibility): string {
  return `# Disposal Eligibility

Run id: ${result.runId}
Eligible: ${result.eligible}
Retention expired: ${result.retention.expired}
Legal hold: ${result.retention.legalHoldStatus}
Archive verified: ${result.archive.verified}
Ledger verified: ${result.ledger.verified}

Blocking reasons:
${result.blockingReasons.map((reason) => `- ${reason}`).join("\n") || "- None"}

No evidence was deleted.
`;
}
