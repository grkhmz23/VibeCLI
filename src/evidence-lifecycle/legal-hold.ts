import { join } from "node:path";
import { sha256File, sha256Text } from "../ledger/hash.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { appendOrgAuditEvent } from "../org/audit-log.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists, readJson } from "../utils/fs.js";
import { appendRetentionLedgerEvent } from "./retention-ledger.js";
import { redactEvidenceText } from "./redaction.js";
import { updateEvidenceLifecycleState } from "./state.js";
import type { LegalHoldRecord } from "./types.js";

export async function legalHoldStatus(
  cwd: string,
  runId: string
): Promise<LegalHoldRecord | { runId: string; status: "not_started" }> {
  const path = legalHoldPath(cwd, runId);
  return pathExists(path) ? readJson<LegalHoldRecord>(path) : { runId, status: "not_started" };
}

export async function enableLegalHold(
  cwd: string,
  runId: string,
  options: { reason?: string; by?: string; confirm?: string }
): Promise<LegalHoldRecord> {
  if (options.confirm !== `ENABLE LEGAL HOLD ${runId}`) {
    throw new Error(`Legal hold enable requires exact confirmation: ENABLE LEGAL HOLD ${runId}`);
  }
  if (!options.reason?.trim() || !options.by?.trim())
    throw new Error("Legal hold requires reason and by.");
  const now = new Date().toISOString();
  const record: LegalHoldRecord = {
    runId,
    status: "enabled",
    enabledAt: now,
    releasedAt: null,
    enabledBy: redactEvidenceText(options.by, 120),
    releasedBy: null,
    reasonHash: sha256Text(options.reason),
    reasonSummary: redactEvidenceText(options.reason, 240),
    releaseReasonHash: null,
    releaseReasonSummary: null,
    warnings: ["Legal hold is metadata only and is not legal advice. No evidence was deleted."]
  };
  await writeLegalHold(cwd, runId, record);
  await recordLegalHoldEvent(cwd, runId, "legal_hold_enabled", "Legal hold metadata enabled.");
  return record;
}

export async function releaseLegalHold(
  cwd: string,
  runId: string,
  options: { reason?: string; by?: string; confirm?: string }
): Promise<LegalHoldRecord> {
  if (options.confirm !== `RELEASE LEGAL HOLD ${runId}`) {
    throw new Error(`Legal hold release requires exact confirmation: RELEASE LEGAL HOLD ${runId}`);
  }
  if (!options.reason?.trim() || !options.by?.trim())
    throw new Error("Legal hold release requires reason and by.");
  const existing = await legalHoldStatus(cwd, runId);
  const enabled = existing.status === "enabled" ? existing : enableSkeleton(runId);
  const record: LegalHoldRecord = {
    ...enabled,
    status: "released",
    releasedAt: new Date().toISOString(),
    releasedBy: redactEvidenceText(options.by, 120),
    releaseReasonHash: sha256Text(options.reason),
    releaseReasonSummary: redactEvidenceText(options.reason, 240),
    warnings: ["Legal hold release is metadata only. No evidence was deleted or purged."]
  };
  await writeLegalHold(cwd, runId, record);
  await recordLegalHoldEvent(cwd, runId, "legal_hold_released", "Legal hold metadata released.");
  return record;
}

function legalHoldPath(cwd: string, runId: string): string {
  return join(new RunStore(cwd).runPath(runId), "evidence-lifecycle", "LEGAL_HOLD.json");
}

async function writeLegalHold(cwd: string, runId: string, record: LegalHoldRecord): Promise<void> {
  const store = new RunStore(cwd);
  await store.writeArtifact(runId, "evidence-lifecycle/LEGAL_HOLD.json", record);
  await store.writeTextArtifact(runId, "evidence-lifecycle/LEGAL_HOLD.md", renderLegalHold(record));
  await updateEvidenceLifecycleState(store, runId, (state) => {
    state.legalHold = {
      status: record.status,
      enabledAt: record.enabledAt,
      releasedAt: record.releasedAt ?? undefined
    };
  });
  await writeLedgerManifest(cwd, runId);
}

async function recordLegalHoldEvent(
  cwd: string,
  runId: string,
  eventType: "legal_hold_enabled" | "legal_hold_released",
  summary: string
): Promise<void> {
  const path = legalHoldPath(cwd, runId);
  const hash = await sha256File(path);
  await appendRetentionLedgerEvent(cwd, {
    eventType,
    runId,
    actor: null,
    summary,
    artifactHashes: [
      { path: `.vibecli/runs/${runId}/evidence-lifecycle/LEGAL_HOLD.json`, sha256: hash.sha256 }
    ]
  }).catch(() => undefined);
  await appendOrgAuditEvent(cwd, {
    eventType: `evidence_lifecycle.${eventType}`,
    actor: null,
    runId,
    summary,
    artifactHashes: [
      { path: `.vibecli/runs/${runId}/evidence-lifecycle/LEGAL_HOLD.json`, sha256: hash.sha256 }
    ],
    redacted: true
  }).catch(() => undefined);
}

function enableSkeleton(runId: string): LegalHoldRecord {
  return {
    runId,
    status: "enabled",
    enabledAt: new Date().toISOString(),
    releasedAt: null,
    enabledBy: "unknown",
    releasedBy: null,
    reasonHash: sha256Text("unknown"),
    reasonSummary: "unknown",
    releaseReasonHash: null,
    releaseReasonSummary: null,
    warnings: []
  };
}

function renderLegalHold(record: LegalHoldRecord): string {
  return `# Legal Hold Metadata

Run id: ${record.runId}
Status: ${record.status}
Enabled by: ${record.enabledBy}
Released by: ${record.releasedBy ?? "not released"}

Legal hold is metadata only and is not legal advice. No evidence was deleted or purged.
`;
}
