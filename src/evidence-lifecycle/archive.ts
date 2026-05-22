import { gzip } from "node:zlib";
import { promisify } from "node:util";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chooseAuditSigningKey } from "../audit/sign.js";
import { sha256File, sha256Text } from "../ledger/hash.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { verifyLedger } from "../ledger/verify.js";
import { canonicalJson, signCanonicalJson } from "../provenance/signature.js";
import { RunStore } from "../orchestrator/run-store.js";
import { ensureDir, pathExists, readJson } from "../utils/fs.js";
import { loadEvidenceLifecycleConfig, evidenceLifecyclePaths } from "./config.js";
import { generateEvidenceInventory } from "./inventory.js";
import { appendRetentionLedgerEvent } from "./retention-ledger.js";
import { redactEvidenceText } from "./redaction.js";
import { updateEvidenceLifecycleState } from "./state.js";
import type { EvidenceArchiveManifest, EvidenceArchiveMode, EvidenceInventory } from "./types.js";

const gzipAsync = promisify(gzip);

export async function previewEvidenceArchive(
  cwd: string,
  runId: string,
  options: { mode?: EvidenceArchiveMode | "forensic-redacted"; json?: boolean } = {}
): Promise<{ runId: string; mode: EvidenceArchiveMode; files: number; excluded: number }> {
  const config = await loadEvidenceLifecycleConfig(cwd);
  const mode = normalizeMode(options.mode) ?? config.default_archive_mode;
  const inventory = await readOrCreateInventory(cwd, runId);
  return {
    runId,
    mode,
    files: inventory.files.filter(
      (file) => includeInMode(file.includedInDefaultArchive, mode) && !file.excluded
    ).length,
    excluded: inventory.files.filter((file) => file.excluded).length
  };
}

export async function createEvidenceArchive(
  cwd: string,
  runId: string,
  options: {
    mode?: EvidenceArchiveMode | "forensic-redacted";
    create?: boolean;
    confirm?: string;
    sign?: boolean;
    allowLedgerWarning?: boolean;
    allowMissingRetention?: boolean;
  } = {}
): Promise<EvidenceArchiveManifest> {
  if (options.confirm !== `ARCHIVE EVIDENCE ${runId}`) {
    throw new Error(
      `Evidence archive creation requires exact confirmation: ARCHIVE EVIDENCE ${runId}`
    );
  }
  const config = await loadEvidenceLifecycleConfig(cwd);
  if (config.require_ledger_pass_for_archive && !options.allowLedgerWarning) {
    const ledger = await verifyLedger(cwd, runId).catch(() => undefined);
    if (!ledger?.ok) throw new Error("Ledger must pass before evidence archive creation.");
  }
  if (config.require_org_retention_plan_for_archive && !options.allowMissingRetention) {
    const retentionPath = join(new RunStore(cwd).runPath(runId), "org", "RETENTION_PLAN.json");
    if (!pathExists(retentionPath))
      throw new Error("Organization retention plan is required before archive.");
  }
  const mode = normalizeMode(options.mode) ?? config.default_archive_mode;
  const inventory = await readOrCreateInventory(cwd, runId);
  const paths = await evidenceLifecyclePaths(cwd);
  const archiveDir = join(paths.archiveDir, runId);
  await ensureDir(archiveDir);
  const store = new RunStore(cwd);
  const runPath = store.runPath(runId);
  const archiveContent: Record<string, string> = {};
  const files = [];
  const excluded = [];
  for (const file of inventory.files) {
    if (!includeInMode(file.includedInDefaultArchive, mode) || file.excluded) {
      excluded.push({
        path: file.path,
        reason: file.exclusionReason ?? "Excluded by archive mode."
      });
      continue;
    }
    const fullPath = join(runPath, file.path);
    if (!pathExists(fullPath)) continue;
    archiveContent[file.path] = redactEvidenceText(
      await readFile(fullPath, "utf8").catch(() => ""),
      20_000
    );
    files.push({
      path: file.path,
      sha256: file.sha256,
      sizeBytes: file.sizeBytes,
      class: file.class,
      redacted: true
    });
  }
  const archiveName = `vibecli-evidence-archive-${runId}-${mode}.tar.gz`;
  const archivePath = join(archiveDir, archiveName);
  await writeFile(archivePath, await gzipAsync(JSON.stringify(archiveContent, null, 2)));
  const archiveHash = await sha256File(archivePath);
  if (archiveHash.sizeBytes > config.max_archive_bytes) {
    throw new Error("Evidence archive exceeds evidence_lifecycle.max_archive_bytes.");
  }
  const unsigned: Omit<EvidenceArchiveManifest, "signature" | "signed"> = {
    runId,
    createdAt: new Date().toISOString(),
    mode,
    algorithm: "sha256",
    archivePath: `.vibecli/evidence-archive/${runId}/${archiveName}`,
    archiveSha256: archiveHash.sha256,
    archiveSizeBytes: archiveHash.sizeBytes,
    files,
    excluded,
    warnings: [
      "Local archive only; originals were not deleted.",
      "Private keys, .env files, raw provider outputs, and unbounded command logs are excluded."
    ]
  };
  const key = options.sign ? await chooseAuditSigningKey(cwd) : undefined;
  const manifest: EvidenceArchiveManifest = {
    ...unsigned,
    signed: Boolean(key),
    signature: key
      ? {
          algorithm: "ed25519",
          publicKeyFingerprint: key.publicFingerprint,
          signatureBase64: signCanonicalJson(unsigned, key.privateKey)
        }
      : {
          algorithm: "sha256-local",
          publicKeyFingerprint: null,
          signatureBase64: sha256Text(canonicalJson(unsigned))
        }
  };
  await writeFile(
    join(archiveDir, "EVIDENCE_ARCHIVE_MANIFEST.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  );
  await writeFile(join(archiveDir, "EVIDENCE_ARCHIVE.md"), renderArchive(manifest), "utf8");
  await store.writeArtifact(runId, "evidence-lifecycle/EVIDENCE_ARCHIVE_POINTER.json", {
    runId,
    archiveManifestPath: manifest.archivePath.replace(
      archiveName,
      "EVIDENCE_ARCHIVE_MANIFEST.json"
    ),
    archivePath: manifest.archivePath,
    archiveSha256: manifest.archiveSha256,
    mode,
    createdAt: manifest.createdAt
  });
  await updateEvidenceLifecycleState(store, runId, (state) => {
    state.archive = {
      status: "archived",
      mode,
      archivePath: manifest.archivePath,
      archiveSha256: manifest.archiveSha256
    };
  });
  await writeLedgerManifest(cwd, runId);
  await appendRetentionLedgerEvent(cwd, {
    eventType: "archive_created",
    runId,
    actor: null,
    summary: "Local evidence archive created.",
    artifactHashes: [{ path: manifest.archivePath, sha256: manifest.archiveSha256 }]
  }).catch(() => undefined);
  return manifest;
}

export async function readArchiveManifest(
  cwd: string,
  runId: string
): Promise<EvidenceArchiveManifest> {
  const paths = await evidenceLifecyclePaths(cwd);
  return readJson<EvidenceArchiveManifest>(
    join(paths.archiveDir, runId, "EVIDENCE_ARCHIVE_MANIFEST.json")
  );
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

function includeInMode(included: boolean, mode: EvidenceArchiveMode): boolean {
  if (!included) return false;
  return mode === "forensic_redacted" || mode === "audit" || mode === "minimal";
}

function normalizeMode(
  mode: EvidenceArchiveMode | "forensic-redacted" | undefined
): EvidenceArchiveMode | undefined {
  return mode === "forensic-redacted" ? "forensic_redacted" : mode;
}

function renderArchive(manifest: EvidenceArchiveManifest): string {
  return `# Evidence Archive

Run id: ${manifest.runId}
Mode: ${manifest.mode}
Archive: ${manifest.archivePath}
SHA256: ${manifest.archiveSha256}
Signed: ${manifest.signed}

Original evidence was not deleted. No remote upload was performed.
`;
}
