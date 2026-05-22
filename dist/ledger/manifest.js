import { readdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { pathExists, readJson } from "../utils/fs.js";
import { RunStore } from "../orchestrator/run-store.js";
import { sha256File, sha256Text } from "./hash.js";
const excluded = new Set(["ledger-manifest.json"]);
async function collectFiles(root, dir = root) {
    const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
    const files = [];
    for (const entry of entries) {
        const path = join(dir, entry.name);
        const rel = relative(root, path).replace(/\\/g, "/");
        if (excluded.has(rel))
            continue;
        if (entry.isDirectory()) {
            files.push(...(await collectFiles(root, path)));
        }
        else if (entry.isFile()) {
            files.push(path);
        }
    }
    return files;
}
function hashManifest(manifest) {
    return sha256Text(JSON.stringify(manifest, null, 2));
}
export async function writeLedgerManifest(cwd, runId) {
    const store = new RunStore(cwd);
    const runPath = store.runPath(runId);
    const existing = pathExists(join(runPath, "ledger-manifest.json"))
        ? await readJson(join(runPath, "ledger-manifest.json")).catch(() => undefined)
        : undefined;
    const now = new Date().toISOString();
    const entries = [];
    for (const file of await collectFiles(runPath)) {
        const rel = relative(runPath, file).replace(/\\/g, "/");
        const hash = await sha256File(file);
        entries.push({ path: rel, ...hash, updatedAt: now });
    }
    entries.sort((a, b) => a.path.localeCompare(b.path));
    const eventLog = entries.find((entry) => entry.path === "agent-events.jsonl")?.sha256 ?? null;
    const withoutHash = {
        runId,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        algorithm: "sha256",
        entries,
        eventLogHash: eventLog
    };
    const manifest = { ...withoutHash, manifestHash: hashManifest(withoutHash) };
    await writeFile(join(runPath, "ledger-manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
    return manifest;
}
export async function readLedgerManifest(cwd, runId) {
    return readJson(join(new RunStore(cwd).runPath(runId), "ledger-manifest.json"));
}
//# sourceMappingURL=manifest.js.map