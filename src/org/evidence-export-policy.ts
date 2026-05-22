import { gzip } from "node:zlib";
import { promisify } from "node:util";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { sha256File } from "../ledger/hash.js";
import { RunStore } from "../orchestrator/run-store.js";
import { redactReleaseText } from "../release/redaction.js";
import { pathExists, readJson } from "../utils/fs.js";
import { appendOrgAuditEvent } from "./audit-log.js";
import { updateOrganizationState } from "./state.js";
import type { EvidenceExportManifest, EvidenceExportPolicy } from "./types.js";

const gzipAsync = promisify(gzip);

const modeFiles: Record<string, string[]> = {
  minimal: [
    "handoff/HANDOFF_SUMMARY.json",
    "release/RELEASE_SUMMARY.json",
    "release/RELEASE_READINESS.md",
    "provenance/provenance-envelope.json",
    "remote-attestation/REMOTE_SUBMISSION_RECEIPT.json",
    "ledger-manifest.json"
  ],
  audit: [
    "evidence/EVIDENCE_MANIFEST.json",
    "release/RELEASE_PACKET.md",
    "release/RELEASE_SUMMARY.json",
    "release/RELEASE_READINESS.md",
    "release/DEPLOYMENT_READINESS.md",
    "handoff/HANDOFF.md",
    "handoff/HANDOFF_SUMMARY.json",
    "scanner-results.json",
    "verification-results.json",
    "approvals.json",
    "org/APPROVAL_MATRIX.json",
    "org/RETENTION_PLAN.json",
    "ledger-manifest.json"
  ],
  forensic_redacted: [
    "state.json",
    "input.json",
    "plan.json",
    "release/RELEASE_PACKET.md",
    "release/RELEASE_SUMMARY.json",
    "release/RELEASE_READINESS.md",
    "handoff/HANDOFF.md",
    "provenance/provenance-statement.json",
    "provenance/provenance-envelope.json",
    "evidence/EVIDENCE_MANIFEST.json",
    "remote-attestation/ATTESTATION_EXPORT.json",
    "remote-attestation/REMOTE_SUBMISSION_RECEIPT.json",
    "org/APPROVAL_MATRIX.json",
    "org/RETENTION_PLAN.json",
    "ledger-manifest.json"
  ]
};

export async function createEvidenceExport(
  cwd: string,
  runId: string,
  options: { mode?: "minimal" | "audit" | "forensic_redacted" | "forensic-redacted" } = {}
): Promise<EvidenceExportManifest> {
  const mode = normalizeMode(options.mode);
  const store = new RunStore(cwd);
  const runPath = store.runPath(runId);
  const files = modeFiles[mode];
  const archive: Record<string, string> = {};
  const entries = [];
  for (const file of files) {
    if (isExcluded(file)) continue;
    const fullPath = join(runPath, file);
    if (!pathExists(fullPath)) continue;
    archive[file] = redactReleaseText(await readFile(fullPath, "utf8"));
    const hash = await sha256File(fullPath);
    entries.push({ path: file, ...hash });
  }
  const policy: EvidenceExportPolicy = {
    runId,
    createdAt: new Date().toISOString(),
    mode,
    includedClasses: includedClasses(mode),
    excludedClasses: [
      "private-keys",
      "env-files",
      "raw-provider-outputs",
      "unbounded-command-logs"
    ],
    redaction: {
      enabled: true,
      privateKeysExcluded: true,
      envFilesExcluded: true,
      rawProviderOutputsExcluded: true,
      commandLogsExcluded: mode !== "forensic_redacted"
    },
    warnings: ["Organization evidence export is redacted and local-only."]
  };
  const base = `org/exports/vibecli-org-evidence-${runId}-${mode}.tar.gz`;
  await store.writeArtifact(runId, "org/exports/EVIDENCE_EXPORT_POLICY.json", policy);
  await store.writeTextArtifact(
    runId,
    "org/exports/EVIDENCE_EXPORT.md",
    renderEvidenceExport(policy, entries)
  );
  const archivePath = join(runPath, base);
  await writeFile(archivePath, await gzipAsync(JSON.stringify(archive, null, 2)));
  const archiveHash = await sha256File(archivePath);
  const manifest: EvidenceExportManifest = {
    runId,
    createdAt: new Date().toISOString(),
    algorithm: "sha256",
    archivePath: base,
    archiveSha256: archiveHash.sha256,
    files: entries,
    policyPath: "org/exports/EVIDENCE_EXPORT_POLICY.json",
    mode
  };
  await store.writeArtifact(runId, "org/exports/EVIDENCE_EXPORT_MANIFEST.json", manifest);
  await updateOrganizationState(store, runId, (org) => {
    org.evidenceExport = { status: "generated", mode };
  });
  await appendOrgAuditEvent(cwd, {
    eventType: "org.evidence_export.created",
    actor: null,
    runId,
    summary: `Organization evidence export created in ${mode} mode.`,
    artifactHashes: [{ path: manifest.archivePath, sha256: manifest.archiveSha256 }],
    redacted: true
  });
  await writeLedgerManifest(cwd, runId);
  return manifest;
}

export async function verifyEvidenceExport(
  cwd: string,
  runId: string
): Promise<{
  ok: boolean;
  checks: Array<{ name: string; ok: boolean; message: string }>;
}> {
  const store = new RunStore(cwd);
  const manifest = await readJson<EvidenceExportManifest>(
    join(store.runPath(runId), "org", "exports", "EVIDENCE_EXPORT_MANIFEST.json")
  );
  const checks = [];
  const archivePath = join(store.runPath(runId), manifest.archivePath);
  if (!pathExists(archivePath)) checks.push({ name: "archive", ok: false, message: "missing" });
  else {
    const hash = await sha256File(archivePath);
    checks.push({
      name: "archive",
      ok: hash.sha256 === manifest.archiveSha256,
      message: hash.sha256 === manifest.archiveSha256 ? "ok" : "hash mismatch"
    });
  }
  const ok = checks.every((check) => check.ok);
  await updateOrganizationState(store, runId, (org) => {
    org.evidenceExport = { status: ok ? "verified" : "invalid", mode: manifest.mode };
  });
  return { ok, checks };
}

function normalizeMode(
  mode: "minimal" | "audit" | "forensic_redacted" | "forensic-redacted" | undefined
): "minimal" | "audit" | "forensic_redacted" {
  return mode === "forensic-redacted" ? "forensic_redacted" : (mode ?? "audit");
}

function isExcluded(path: string): boolean {
  return (
    path.includes(".vibecli/keys") ||
    path.includes(".vibecli/org/keys") ||
    path.endsWith(".private.pem") ||
    path.includes(".env") ||
    path.includes("agent-outputs")
  );
}

function includedClasses(mode: string): string[] {
  if (mode === "minimal") return ["summaries", "provenance", "ledger"];
  if (mode === "audit") return ["release", "handoff", "approvals", "retention", "ledger"];
  return ["release", "handoff", "provenance", "remote-attestation", "approvals", "ledger"];
}

function renderEvidenceExport(
  policy: EvidenceExportPolicy,
  files: Array<{ path: string }>
): string {
  return `# Organization Evidence Export

Mode: ${policy.mode}
Redaction enabled: true

Files:
${files.map((file) => `- ${file.path}`).join("\n") || "- none"}

No remote upload is performed.
`;
}
