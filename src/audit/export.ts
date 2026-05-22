import { join } from "node:path";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { sha256File, sha256Text } from "../ledger/hash.js";
import { verifyLedger } from "../ledger/verify.js";
import { verifyProvenance } from "../provenance/verify.js";
import { verifyEvidenceBundle } from "../provenance/evidence-bundle.js";
import { verifyOrgAuditLog, appendOrgAuditEvent } from "../org/audit-log.js";
import { loadConfig } from "../config/config.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists, readJson } from "../utils/fs.js";
import { generateAuditCoverage } from "./coverage.js";
import { generateAuditEvidenceMap } from "./evidence-mapper.js";
import { generateAuditGaps } from "./gaps.js";
import { chooseAuditSigningKey, makeSignedAuditEnvelope } from "./sign.js";
import { updateAuditState } from "./state.js";
import { verifyAuditManifest, type AuditManifest } from "./verify.js";
import type { AuditCoverageReport, AuditGapsReport, AuditReport } from "./types.js";

export async function createAuditExport(
  cwd: string,
  runId: string,
  options: {
    schema?: string;
    sign?: boolean;
    confirm?: string;
    format?: "json" | "markdown" | "csv";
  } = {}
): Promise<AuditReport> {
  if (options.sign && options.confirm !== `SIGN AUDIT EXPORT ${runId}`) {
    throw new Error(`Audit export signing requires exact confirmation: SIGN AUDIT EXPORT ${runId}`);
  }
  const map = await generateAuditEvidenceMap(cwd, runId, { schema: options.schema });
  const coverage = await generateAuditCoverage(cwd, runId, { schema: map.schema.name });
  const gaps = await generateAuditGaps(cwd, runId, { schema: map.schema.name });
  const config = await loadConfig(cwd);
  const integrity = await collectIntegrity(cwd, runId);
  const report: AuditReport = {
    version: 1,
    type: "vibecli.audit.report",
    runId,
    createdAt: new Date().toISOString(),
    schema: map.schema.name,
    disclaimer: map.disclaimer,
    coverage: coverage.coverage,
    gaps: gaps.summary,
    controlResults: map.controls,
    evidenceIndex: map.controls.flatMap((control) => control.evidence),
    org: {
      orgId: config.organization.org_id ?? null,
      orgName: config.organization.org_name ?? null,
      policyBundleVerified: pathExists(
        join(cwd, ".vibecli/org/policy-bundles/latest/ORG_POLICY_ENVELOPE.json")
      )
        ? true
        : null,
      approvalQuorum: await readApprovalQuorum(cwd, runId)
    },
    integrity,
    warnings: ["Audit exports are local audit-support artifacts and do not certify compliance."]
  };
  const store = new RunStore(cwd);
  await store.writeArtifact(runId, "audit/export/AUDIT_REPORT.json", report);
  await store.writeTextArtifact(
    runId,
    "audit/export/AUDIT_REPORT.md",
    renderAuditReport(report, coverage, gaps)
  );
  await store.writeTextArtifact(
    runId,
    "audit/export/AUDIT_REPORT.csv",
    renderAuditCsv(map.controls)
  );
  const manifest = await writeAuditExportManifest(cwd, runId);
  if (options.sign) {
    const key = await chooseAuditSigningKey(cwd);
    const envelope = makeSignedAuditEnvelope(
      runId,
      "vibecli.audit.report-envelope",
      "audit/export/AUDIT_REPORT.json",
      report,
      key
    );
    await store.writeArtifact(runId, "audit/export/AUDIT_REPORT_ENVELOPE.json", envelope);
    await store.writeTextArtifact(
      runId,
      "audit/export/AUDIT_REPORT_SIGNATURE.md",
      renderSignature(envelope.signature.publicKeyFingerprint, key.keyType)
    );
    await appendOrgAuditEvent(cwd, {
      eventType: "audit.export.signed",
      actor: null,
      runId,
      summary: "Audit report export signed.",
      artifactHashes: [
        {
          path: "audit/export/AUDIT_REPORT.json",
          sha256:
            manifest.files.find((file) => file.path.endsWith("AUDIT_REPORT.json"))?.sha256 ?? ""
        }
      ],
      redacted: true
    }).catch(() => undefined);
  }
  await updateAuditState(store, runId, (audit) => {
    audit.export = { status: options.sign ? "signed" : "generated", signed: Boolean(options.sign) };
  });
  await writeLedgerManifest(cwd, runId);
  return report;
}

export async function verifyAuditExport(cwd: string, runId: string) {
  const store = new RunStore(cwd);
  const root = join(store.runPath(runId), "audit", "export");
  const result = await verifyAuditManifest(
    root,
    join(root, "AUDIT_EXPORT_MANIFEST.json"),
    join(root, "AUDIT_REPORT_ENVELOPE.json"),
    join(root, "AUDIT_REPORT.json")
  );
  await updateAuditState(store, runId, (audit) => {
    audit.export = { status: result.ok ? "verified" : "invalid" };
  });
  await writeLedgerManifest(cwd, runId);
  return result;
}

async function collectIntegrity(cwd: string, runId: string): Promise<AuditReport["integrity"]> {
  return {
    ledgerVerified: (await verifyLedger(cwd, runId).catch(() => ({ ok: false }))).ok,
    provenanceVerified: (await verifyProvenance(cwd, runId).catch(() => undefined))?.ok ?? null,
    evidenceVerified: (await verifyEvidenceBundle(cwd, runId).catch(() => undefined))?.ok ?? null,
    orgAuditVerified: (await verifyOrgAuditLog(cwd).catch(() => undefined))?.ok ?? null
  };
}

async function readApprovalQuorum(cwd: string, runId: string): Promise<string | null> {
  const path = join(new RunStore(cwd).runPath(runId), "org", "APPROVAL_MATRIX.json");
  if (!pathExists(path)) return null;
  const matrix = await readJson<{ quorum?: { status?: string } }>(path).catch(() => undefined);
  return matrix?.quorum?.status ?? null;
}

async function writeAuditExportManifest(cwd: string, runId: string): Promise<AuditManifest> {
  const store = new RunStore(cwd);
  const root = join(store.runPath(runId), "audit", "export");
  const files = [];
  for (const path of ["AUDIT_REPORT.json", "AUDIT_REPORT.md", "AUDIT_REPORT.csv"]) {
    const hash = await sha256File(join(root, path));
    files.push({ path, ...hash });
  }
  const withoutHash = {
    runId,
    createdAt: new Date().toISOString(),
    algorithm: "sha256" as const,
    files
  };
  const manifest: AuditManifest = {
    ...withoutHash,
    manifestHash: sha256Text(JSON.stringify(withoutHash, null, 2))
  };
  await store.writeArtifact(runId, "audit/export/AUDIT_EXPORT_MANIFEST.json", manifest);
  return manifest;
}

function renderAuditReport(
  report: AuditReport,
  coverage: AuditCoverageReport,
  gaps: AuditGapsReport
): string {
  return `# Audit Report Export

Schema: ${report.schema}

${report.disclaimer}

Required coverage: ${coverage.coverage.percentSatisfied}%
P0 gaps: ${gaps.summary.p0}
P1 gaps: ${gaps.summary.p1}

This is an audit-support artifact. It does not certify legal or regulatory compliance.
`;
}

function renderAuditCsv(controls: object[]): string {
  const rows = ["controlId,title,category,severity,status"];
  for (const control of controls as Array<{
    id: string;
    title: string;
    category: string;
    severity: string;
    status: string;
  }>) {
    rows.push(
      [control.id, control.title, control.category, control.severity, control.status]
        .map(csv)
        .join(",")
    );
  }
  return `${rows.join("\n")}\n`;
}

function renderSignature(fingerprint: string, keyType: string): string {
  return `# Audit Report Signature

Key type: ${keyType}
Public key fingerprint: ${fingerprint}

Private keys are not included.
`;
}

function csv(value: string): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}
