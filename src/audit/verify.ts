import { join } from "node:path";
import { sha256File } from "../ledger/hash.js";
import { pathExists, readJson } from "../utils/fs.js";
import type { SignedAuditEnvelope } from "./types.js";
import { verifySignedAuditEnvelope } from "./sign.js";

export type AuditManifest = {
  runId: string;
  createdAt: string;
  algorithm: "sha256";
  files: Array<{ path: string; sha256: string; sizeBytes: number }>;
  archivePath?: string;
  archiveSha256?: string;
  manifestHash: string;
};

export async function verifyAuditManifest(
  root: string,
  manifestPath: string,
  envelopePath?: string,
  reportPath?: string
): Promise<{ ok: boolean; checks: Array<{ name: string; ok: boolean; message: string }> }> {
  const manifest = await readJson<AuditManifest>(manifestPath);
  const checks: Array<{ name: string; ok: boolean; message: string }> = [];
  for (const file of manifest.files) {
    const fullPath = join(root, file.path);
    if (!pathExists(fullPath)) {
      checks.push({ name: file.path, ok: false, message: "missing" });
      continue;
    }
    const hash = await sha256File(fullPath);
    checks.push({
      name: file.path,
      ok: hash.sha256 === file.sha256 && hash.sizeBytes === file.sizeBytes,
      message: hash.sha256 === file.sha256 ? "ok" : "hash mismatch"
    });
  }
  if (manifest.archivePath && manifest.archiveSha256) {
    const archive = join(root, manifest.archivePath);
    const hash = pathExists(archive) ? await sha256File(archive) : undefined;
    checks.push({
      name: "archive",
      ok: hash?.sha256 === manifest.archiveSha256,
      message: hash?.sha256 === manifest.archiveSha256 ? "ok" : "archive hash mismatch"
    });
  }
  if (envelopePath && reportPath && pathExists(envelopePath)) {
    const envelope = await readJson<SignedAuditEnvelope>(envelopePath);
    const signed = await verifySignedAuditEnvelope(envelope, reportPath);
    checks.push({ name: "signature", ok: signed.ok, message: signed.message });
  }
  return { ok: checks.every((check) => check.ok), checks };
}
