import { join } from "node:path";
import { pathExists, readJson } from "../utils/fs.js";
import { RunStore } from "../orchestrator/run-store.js";
import { sha256File, sha256Text } from "./hash.js";
import { readLedgerManifest, type LedgerManifest } from "./manifest.js";
import type { DeletedArtifactsRecord } from "../evidence-disposal/types.js";

export type LedgerVerification = {
  runId: string;
  ok: boolean;
  checkedAt: string;
  entries: Array<{ path: string; ok: boolean; reason: string }>;
  manifestHashOk: boolean;
  status: "pass" | "pass_with_disposals" | "fail";
  disposalsAccepted: number;
};

export async function verifyLedger(
  cwd: string,
  runId: string,
  options: { strict?: boolean } = {}
): Promise<LedgerVerification> {
  const manifest = await readLedgerManifest(cwd, runId);
  const runPath = new RunStore(cwd).runPath(runId);
  const deletedArtifacts = await readDeletedArtifacts(runPath);
  const receiptPath = join(runPath, "evidence-lifecycle", "disposal", "DISPOSAL_RECEIPT.json");
  const receiptHash = pathExists(receiptPath)
    ? (await sha256File(receiptPath).catch(() => undefined))?.sha256
    : undefined;
  const acceptedDeleted = deletedArtifacts.filter(
    (entry) => receiptHash && entry.receiptSha256 === receiptHash
  );
  const disposalReceiptOk =
    deletedArtifacts.length === 0 ||
    (Boolean(receiptHash) && acceptedDeleted.length === deletedArtifacts.length);
  const entries = await Promise.all(
    manifest.entries.map(async (entry) => {
      const path = join(runPath, entry.path);
      if (!pathExists(path)) {
        const deleted = acceptedDeleted.find(
          (artifact) =>
            artifact.path === entry.path &&
            artifact.sha256BeforeDelete === entry.sha256 &&
            artifact.sizeBytes === entry.sizeBytes
        );
        if (deleted && !options.strict) {
          return { path: entry.path, ok: true, reason: "intentionally_deleted" };
        }
        return {
          path: entry.path,
          ok: false,
          reason: deleted ? "intentionally_deleted_strict" : "missing"
        };
      }
      const hash = await sha256File(path);
      return {
        path: entry.path,
        ok: hash.sha256 === entry.sha256 && hash.sizeBytes === entry.sizeBytes,
        reason:
          hash.sha256 === entry.sha256 && hash.sizeBytes === entry.sizeBytes
            ? "ok"
            : "hash mismatch"
      };
    })
  );
  const withoutHash: Omit<LedgerManifest, "manifestHash"> = {
    runId: manifest.runId,
    createdAt: manifest.createdAt,
    updatedAt: manifest.updatedAt,
    algorithm: manifest.algorithm,
    entries: manifest.entries,
    eventLogHash: manifest.eventLogHash
  };
  const manifestHashOk = sha256Text(JSON.stringify(withoutHash, null, 2)) === manifest.manifestHash;
  const hasAcceptedDisposals = acceptedDeleted.length > 0;
  const ok =
    entries.every((entry) => entry.ok) &&
    manifestHashOk &&
    disposalReceiptOk &&
    (!options.strict || !hasAcceptedDisposals);
  return {
    runId,
    ok,
    checkedAt: new Date().toISOString(),
    entries,
    manifestHashOk,
    status: ok ? (hasAcceptedDisposals ? "pass_with_disposals" : "pass") : "fail",
    disposalsAccepted: acceptedDeleted.length
  };
}

async function readDeletedArtifacts(
  runPath: string
): Promise<DeletedArtifactsRecord["deletedArtifacts"]> {
  const path = join(runPath, "evidence-lifecycle", "disposal", "DELETED_ARTIFACTS.json");
  if (!pathExists(path)) return [];
  return (await readJson<DeletedArtifactsRecord>(path).catch(() => ({ deletedArtifacts: [] })))
    .deletedArtifacts;
}
