import { gzip } from "node:zlib";
import { promisify } from "node:util";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { sha256File, sha256Text } from "../ledger/hash.js";
import { verifyLedger } from "../ledger/verify.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { appendOrgAuditEvent, verifyOrgAuditLog } from "../org/audit-log.js";
import { RunStore } from "../orchestrator/run-store.js";
import { redactReleaseText } from "../release/redaction.js";
import { pathExists, readJson } from "../utils/fs.js";
import { generateAuditCoverage } from "./coverage.js";
import { generateAuditGaps } from "./gaps.js";
import { updateAuditState } from "./state.js";
import { verifyAuditExport } from "./export.js";
import { verifyComplianceBundle } from "./compliance-bundle.js";
import { verifyAuditManifest, type AuditManifest } from "./verify.js";
import type { AuditorHandoff } from "./types.js";

const gzipAsync = promisify(gzip);

export async function createAuditorHandoff(
  cwd: string,
  runId: string,
  options: { schema?: string; minimal?: boolean } = {}
): Promise<AuditorHandoff> {
  const coverage = await generateAuditCoverage(cwd, runId, { schema: options.schema });
  const gaps = await generateAuditGaps(cwd, runId, { schema: coverage.schema });
  const store = new RunStore(cwd);
  const runPath = store.runPath(runId);
  const handoff: AuditorHandoff = {
    version: 1,
    type: "vibecli.auditor.handoff",
    runId,
    createdAt: new Date().toISOString(),
    schema: coverage.schema,
    disclaimer: coverage.disclaimer,
    executiveSummary:
      "Local auditor handoff bundle generated from redacted VibeCLI audit-support artifacts.",
    evidenceIndex: await readEvidenceIndex(cwd, runId),
    coverage: coverage.coverage,
    gaps: gaps.summary,
    signedReports: {
      auditReportSigned: pathExists(join(runPath, "audit/export/AUDIT_REPORT_ENVELOPE.json")),
      complianceBundleSigned: pathExists(
        join(runPath, "audit/compliance/COMPLIANCE_BUNDLE_ENVELOPE.json")
      ),
      provenanceSigned: pathExists(join(runPath, "provenance/provenance-envelope.json")),
      orgPolicySigned: pathExists(
        join(cwd, ".vibecli/org/policy-bundles/latest/ORG_POLICY_ENVELOPE.json")
      )
    },
    verification: {
      ledgerVerified: (await verifyLedger(cwd, runId).catch(() => ({ ok: false }))).ok,
      auditExportVerified: (await verifyAuditExport(cwd, runId).catch(() => undefined))?.ok ?? null,
      complianceBundleVerified:
        (await verifyComplianceBundle(cwd, runId).catch(() => undefined))?.ok ?? null,
      orgAuditVerified: (await verifyOrgAuditLog(cwd).catch(() => undefined))?.ok ?? null
    },
    reviewerApprovals: await readOptionalJson(join(runPath, "org/APPROVAL_MATRIX.json")),
    retention: await readOptionalJson(join(runPath, "org/RETENTION_PLAN.json")),
    evidenceLifecycle: stateEvidenceLifecycle(await new RunStore(cwd).readState(runId)),
    evidenceDisposal: stateEvidenceDisposal(await new RunStore(cwd).readState(runId)),
    warnings: ["Auditor handoff is local, redacted, and does not certify compliance."]
  };
  await store.writeArtifact(runId, "audit/auditor-handoff/AUDITOR_HANDOFF.json", handoff);
  await store.writeTextArtifact(
    runId,
    "audit/auditor-handoff/AUDITOR_HANDOFF.md",
    renderAuditorHandoff(handoff)
  );
  const archive: Record<string, string> = {};
  for (const file of [
    "audit/auditor-handoff/AUDITOR_HANDOFF.json",
    "audit/AUDIT_COVERAGE.json",
    "audit/AUDIT_GAPS.json",
    "audit/export/AUDIT_REPORT.json",
    "audit/compliance/COMPLIANCE_CHECK_BUNDLE.json"
  ]) {
    const fullPath = join(runPath, file);
    if (pathExists(fullPath)) archive[file] = redactReleaseText(await readFile(fullPath, "utf8"));
  }
  const archivePath = join(
    runPath,
    "audit",
    "auditor-handoff",
    `vibecli-auditor-handoff-${runId}.tar.gz`
  );
  await writeFile(archivePath, await gzipAsync(JSON.stringify(archive, null, 2)));
  const archiveHash = await sha256File(archivePath);
  const manifest = await writeAuditorHandoffManifest(cwd, runId, archiveHash.sha256);
  await updateAuditState(store, runId, (audit) => {
    audit.auditorHandoff = { status: "generated" };
  });
  await appendOrgAuditEvent(cwd, {
    eventType: "audit.auditor_handoff.created",
    actor: null,
    runId,
    summary: "Auditor handoff bundle created.",
    artifactHashes: [
      { path: "audit/auditor-handoff/AUDITOR_HANDOFF_MANIFEST.json", sha256: manifest.manifestHash }
    ],
    redacted: true
  }).catch(() => undefined);
  await writeLedgerManifest(cwd, runId);
  return handoff;
}

export async function verifyAuditorHandoff(cwd: string, runId: string) {
  const store = new RunStore(cwd);
  const root = join(store.runPath(runId), "audit", "auditor-handoff");
  const result = await verifyAuditManifest(root, join(root, "AUDITOR_HANDOFF_MANIFEST.json"));
  await updateAuditState(store, runId, (audit) => {
    audit.auditorHandoff = { status: result.ok ? "verified" : "invalid" };
  });
  await writeLedgerManifest(cwd, runId);
  return result;
}

async function readEvidenceIndex(cwd: string, runId: string): Promise<object[]> {
  const path = join(new RunStore(cwd).runPath(runId), "audit", "AUDIT_EVIDENCE_MAP.json");
  const map = await readJson<{ controls?: Array<{ evidence?: object[] }> }>(path).catch(
    () => undefined
  );
  return map?.controls?.flatMap((control) => control.evidence ?? []) ?? [];
}

async function readOptionalJson(path: string): Promise<object> {
  return pathExists(path) ? await readJson<object>(path).catch(() => ({})) : {};
}

function stateEvidenceLifecycle(state: Awaited<ReturnType<RunStore["readState"]>>): object {
  return {
    inventory: state.evidenceLifecycle?.inventory.status ?? "not_started",
    archive: state.evidenceLifecycle?.archive.status ?? "not_started",
    retentionLedger: state.evidenceLifecycle?.retentionLedger.status ?? "not_started",
    legalHold: state.evidenceLifecycle?.legalHold.status ?? "not_started",
    compaction: state.evidenceLifecycle?.compaction.status ?? "not_started"
  };
}

function stateEvidenceDisposal(state: Awaited<ReturnType<RunStore["readState"]>>): object {
  return {
    eligibility: state.evidenceDisposal?.eligibility.status ?? "not_started",
    plan: state.evidenceDisposal?.plan.status ?? "not_started",
    precheck: state.evidenceDisposal?.precheck.status ?? "not_started",
    execution: state.evidenceDisposal?.execution.status ?? "not_started"
  };
}

async function writeAuditorHandoffManifest(
  cwd: string,
  runId: string,
  archiveSha256: string
): Promise<AuditManifest> {
  const store = new RunStore(cwd);
  const root = join(store.runPath(runId), "audit", "auditor-handoff");
  const files = [];
  for (const path of ["AUDITOR_HANDOFF.json", "AUDITOR_HANDOFF.md"]) {
    const hash = await sha256File(join(root, path));
    files.push({ path, ...hash });
  }
  const withoutHash = {
    runId,
    createdAt: new Date().toISOString(),
    algorithm: "sha256" as const,
    files,
    archivePath: `vibecli-auditor-handoff-${runId}.tar.gz`,
    archiveSha256
  };
  const manifest: AuditManifest = {
    ...withoutHash,
    manifestHash: sha256Text(JSON.stringify(withoutHash, null, 2))
  };
  await store.writeArtifact(runId, "audit/auditor-handoff/AUDITOR_HANDOFF_MANIFEST.json", manifest);
  return manifest;
}

function renderAuditorHandoff(handoff: AuditorHandoff): string {
  return `# Auditor Handoff

Schema: ${handoff.schema}

${handoff.disclaimer}

${handoff.executiveSummary}

Ledger verified: ${handoff.verification.ledgerVerified}
Audit report signed: ${handoff.signedReports.auditReportSigned}
Compliance bundle signed: ${handoff.signedReports.complianceBundleSigned}

No remote upload was performed.
`;
}
