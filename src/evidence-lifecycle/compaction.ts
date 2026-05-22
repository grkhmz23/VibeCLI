import { gzip } from "node:zlib";
import { promisify } from "node:util";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { sha256File, sha256Text } from "../ledger/hash.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { RunStore } from "../orchestrator/run-store.js";
import { ensureDir, pathExists, readJson } from "../utils/fs.js";
import { generateEvidenceInventory } from "./inventory.js";
import { appendRetentionLedgerEvent } from "./retention-ledger.js";
import { redactEvidenceText } from "./redaction.js";
import { updateEvidenceLifecycleState } from "./state.js";
import type { EvidenceInventory } from "./types.js";

const gzipAsync = promisify(gzip);

export type CompactionReport = {
  runId: string;
  createdAt: string;
  totalBytes: number;
  summaryBundleBytesEstimate: number;
  estimatedSavingsBytes: number;
  estimatedSavingsPercent: number;
  largeArtifacts: Array<{
    path: string;
    sizeBytes: number;
    class: string;
    recommendation: "keep" | "summarize_in_bundle" | "exclude_from_summary_bundle";
  }>;
  summaryBundleRecommended: boolean;
  deleteOriginalsRecommended: false;
  purgeImplemented: false;
  warnings: string[];
};

export async function createCompactionReport(
  cwd: string,
  runId: string
): Promise<CompactionReport> {
  const inventory = await readOrCreateInventory(cwd, runId);
  const totalBytes = inventory.summary.totalBytes;
  const summaryBundleBytesEstimate = Math.min(
    totalBytes,
    Math.max(1024, inventory.summary.includedFiles * 512)
  );
  const estimatedSavingsBytes = Math.max(0, totalBytes - summaryBundleBytesEstimate);
  const report: CompactionReport = {
    runId,
    createdAt: new Date().toISOString(),
    totalBytes,
    summaryBundleBytesEstimate,
    estimatedSavingsBytes,
    estimatedSavingsPercent:
      totalBytes === 0 ? 0 : Math.round((estimatedSavingsBytes / totalBytes) * 10000) / 100,
    largeArtifacts: inventory.files
      .filter((file) => file.sizeBytes > 4096 || file.excluded)
      .map((file) => ({
        path: file.path,
        sizeBytes: file.sizeBytes,
        class: file.class,
        recommendation: file.excluded ? "exclude_from_summary_bundle" : "summarize_in_bundle"
      })),
    summaryBundleRecommended: inventory.summary.includedFiles > 0,
    deleteOriginalsRecommended: false,
    purgeImplemented: false,
    warnings: ["Compaction report does not delete, purge, rewrite, upload, or move originals."]
  };
  const store = new RunStore(cwd);
  await store.writeArtifact(runId, "evidence-lifecycle/EVIDENCE_COMPACTION_REPORT.json", report);
  await store.writeTextArtifact(
    runId,
    "evidence-lifecycle/EVIDENCE_COMPACTION_REPORT.md",
    renderReport(report)
  );
  await updateEvidenceLifecycleState(store, runId, (state) => {
    state.compaction = { status: "reported", estimatedSavingsBytes };
  });
  await writeLedgerManifest(cwd, runId);
  await appendRetentionLedgerEvent(cwd, {
    eventType: "compaction_reported",
    runId,
    actor: null,
    summary: "Evidence compaction report generated.",
    artifactHashes: [
      {
        path: `.vibecli/runs/${runId}/evidence-lifecycle/EVIDENCE_COMPACTION_REPORT.json`,
        sha256: (
          await sha256File(
            join(
              new RunStore(cwd).runPath(runId),
              "evidence-lifecycle",
              "EVIDENCE_COMPACTION_REPORT.json"
            )
          )
        ).sha256
      }
    ]
  }).catch(() => undefined);
  return report;
}

export async function createCompactEvidenceBundle(
  cwd: string,
  runId: string,
  options: { confirm?: string } = {}
): Promise<object> {
  if (options.confirm !== `CREATE COMPACT EVIDENCE ${runId}`) {
    throw new Error(
      `Compact evidence bundle requires exact confirmation: CREATE COMPACT EVIDENCE ${runId}`
    );
  }
  const report = await createCompactionReport(cwd, runId);
  const store = new RunStore(cwd);
  const runPath = store.runPath(runId);
  const summaryFiles = [
    "state.json",
    "ledger-manifest.json",
    "release/RELEASE_SUMMARY.json",
    "audit/AUDIT_COVERAGE.json",
    "evidence-lifecycle/EVIDENCE_INVENTORY.json",
    "evidence-lifecycle/EVIDENCE_COMPACTION_REPORT.json"
  ];
  const archive: Record<string, string> = {};
  const includedSummaries: string[] = [];
  const excludedRawArtifacts: string[] = [];
  for (const file of summaryFiles) {
    const full = join(runPath, file);
    if (pathExists(full)) {
      archive[file] = redactEvidenceText(await readFile(full, "utf8"), 8000);
      includedSummaries.push(file);
    }
  }
  for (const file of (await readOrCreateInventory(cwd, runId)).files) {
    if (file.excluded) excludedRawArtifacts.push(file.path);
  }
  const compactDir = join(runPath, "evidence-lifecycle", "compact");
  await ensureDir(compactDir);
  const archivePath = join(compactDir, `vibecli-compact-evidence-${runId}.tar.gz`);
  await writeFile(archivePath, await gzipAsync(JSON.stringify(archive, null, 2)));
  const archiveHash = await sha256File(archivePath);
  const bundle = {
    runId,
    createdAt: new Date().toISOString(),
    readOnly: true,
    deleteOriginals: false,
    includedSummaries,
    excludedRawArtifacts,
    archiveSha256: archiveHash.sha256,
    warnings: ["Compact evidence bundle is redacted and local-only. Originals were not deleted."]
  };
  await store.writeArtifact(
    runId,
    "evidence-lifecycle/compact/COMPACT_EVIDENCE_BUNDLE.json",
    bundle
  );
  await store.writeTextArtifact(
    runId,
    "evidence-lifecycle/compact/COMPACT_EVIDENCE_BUNDLE.md",
    renderBundle(bundle)
  );
  const manifest = {
    runId,
    createdAt: new Date().toISOString(),
    algorithm: "sha256",
    archivePath: `evidence-lifecycle/compact/vibecli-compact-evidence-${runId}.tar.gz`,
    archiveSha256: archiveHash.sha256,
    files: [
      {
        path: "COMPACT_EVIDENCE_BUNDLE.json",
        ...(await sha256File(
          join(runPath, "evidence-lifecycle", "compact", "COMPACT_EVIDENCE_BUNDLE.json")
        ))
      },
      {
        path: "COMPACT_EVIDENCE_BUNDLE.md",
        ...(await sha256File(
          join(runPath, "evidence-lifecycle", "compact", "COMPACT_EVIDENCE_BUNDLE.md")
        ))
      }
    ],
    manifestHash: ""
  };
  manifest.manifestHash = sha256Text(JSON.stringify({ ...manifest, manifestHash: "" }, null, 2));
  await store.writeArtifact(
    runId,
    "evidence-lifecycle/compact/COMPACT_EVIDENCE_MANIFEST.json",
    manifest
  );
  await updateEvidenceLifecycleState(store, runId, (state) => {
    state.compaction = { status: "bundled", estimatedSavingsBytes: report.estimatedSavingsBytes };
  });
  await writeLedgerManifest(cwd, runId);
  await appendRetentionLedgerEvent(cwd, {
    eventType: "compaction_bundle_created",
    runId,
    actor: null,
    summary: "Compact evidence summary bundle created.",
    artifactHashes: [{ path: manifest.archivePath, sha256: archiveHash.sha256 }]
  }).catch(() => undefined);
  return bundle;
}

export async function verifyCompactEvidenceBundle(
  cwd: string,
  runId: string
): Promise<{ ok: boolean; checks: Array<{ name: string; ok: boolean; message: string }> }> {
  const store = new RunStore(cwd);
  const runPath = store.runPath(runId);
  const manifestPath = join(
    runPath,
    "evidence-lifecycle",
    "compact",
    "COMPACT_EVIDENCE_MANIFEST.json"
  );
  const manifest = await readJson<{ archivePath: string; archiveSha256: string }>(manifestPath);
  const archivePath = join(runPath, manifest.archivePath);
  const hash = pathExists(archivePath) ? await sha256File(archivePath) : undefined;
  const checks = [
    {
      name: "archive",
      ok: hash?.sha256 === manifest.archiveSha256,
      message: hash?.sha256 === manifest.archiveSha256 ? "ok" : "hash mismatch"
    }
  ];
  await updateEvidenceLifecycleState(store, runId, (state) => {
    state.compaction = { status: checks.every((check) => check.ok) ? "verified" : "invalid" };
  });
  await writeLedgerManifest(cwd, runId);
  return { ok: checks.every((check) => check.ok), checks };
}

async function readOrCreateInventory(cwd: string, runId: string): Promise<EvidenceInventory> {
  const path = join(
    new RunStore(cwd).runPath(runId),
    "evidence-lifecycle",
    "EVIDENCE_INVENTORY.json"
  );
  return pathExists(path)
    ? readJson<EvidenceInventory>(path)
    : generateEvidenceInventory(cwd, runId);
}

function renderReport(report: CompactionReport): string {
  return `# Evidence Compaction Report

Total bytes: ${report.totalBytes}
Estimated savings: ${report.estimatedSavingsBytes} (${report.estimatedSavingsPercent}%)
Delete originals recommended: false
Purge implemented: false
`;
}

function renderBundle(bundle: object): string {
  return `# Compact Evidence Bundle

Read-only compact summary bundle created. Originals were not deleted and no upload was performed.

${JSON.stringify(bundle, null, 2)}
`;
}
