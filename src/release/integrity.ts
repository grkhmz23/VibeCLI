import { readdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { readJson, pathExists } from "../utils/fs.js";
import { RunStore } from "../orchestrator/run-store.js";
import { sha256File, sha256Text } from "../ledger/hash.js";
import { verifyLedger } from "../ledger/verify.js";
import type { ReleaseManifest } from "./types.js";

async function collectReleaseFiles(root: string, dir = root): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const rel = relative(root, fullPath).replace(/\\/g, "/");
    if (rel === "RELEASE_MANIFEST.json") continue;
    if (entry.isDirectory()) files.push(...(await collectReleaseFiles(root, fullPath)));
    if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

export async function writeReleaseManifest(cwd: string, runId: string): Promise<ReleaseManifest> {
  const releaseRoot = join(new RunStore(cwd).runPath(runId), "release");
  const files = [];
  for (const file of await collectReleaseFiles(releaseRoot)) {
    const hash = await sha256File(file);
    files.push({ path: `release/${relative(releaseRoot, file).replace(/\\/g, "/")}`, ...hash });
  }
  files.sort((a, b) => a.path.localeCompare(b.path));
  const base = {
    runId,
    createdAt: new Date().toISOString(),
    algorithm: "sha256" as const,
    files
  };
  const manifest = { ...base, manifestHash: sha256Text(JSON.stringify(base, null, 2)) };
  await writeFile(
    join(releaseRoot, "RELEASE_MANIFEST.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  );
  return manifest;
}

export async function verifyReleaseIntegrity(
  cwd: string,
  runId: string
): Promise<{
  runId: string;
  ok: boolean;
  ledgerStatus: "pass" | "fail" | "missing";
  files: Array<{ path: string; ok: boolean; reason: string }>;
}> {
  const store = new RunStore(cwd);
  const manifestPath = join(store.runPath(runId), "release", "RELEASE_MANIFEST.json");
  const manifest = await readJson<ReleaseManifest>(manifestPath);
  const files = await Promise.all(
    manifest.files.map(async (file) => {
      const fullPath = join(store.runPath(runId), file.path);
      if (!pathExists(fullPath)) return { path: file.path, ok: false, reason: "missing" };
      const hash = await sha256File(fullPath);
      return {
        path: file.path,
        ok: hash.sha256 === file.sha256 && hash.sizeBytes === file.sizeBytes,
        reason:
          hash.sha256 === file.sha256 && hash.sizeBytes === file.sizeBytes ? "ok" : "hash mismatch"
      };
    })
  );
  const ledger = await verifyLedger(cwd, runId).catch(() => undefined);
  return {
    runId,
    ok: files.every((file) => file.ok) && (ledger?.ok ?? false),
    ledgerStatus: ledger ? (ledger.ok ? "pass" : "fail") : "missing",
    files
  };
}
