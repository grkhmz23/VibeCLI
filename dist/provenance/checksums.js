import { join } from "node:path";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { sha256File } from "../ledger/hash.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists, readJson } from "../utils/fs.js";
import { updateProvenanceState } from "./state.js";
export const safeChecksumPaths = [
    "release/RELEASE_SUMMARY.json",
    "release/RELEASE_PACKET.md",
    "release/RELEASE_NOTES.md",
    "release/RELEASE_READINESS.md",
    "release/DEPLOYMENT_READINESS.md",
    "release/CI_STATUS.md",
    "handoff/HANDOFF_SUMMARY.json",
    "handoff/PR_DESCRIPTION.md",
    "git/repository-lifecycle.json",
    "ledger-manifest.json",
    "provenance/provenance-statement.json",
    "provenance/provenance-envelope.json"
];
export async function createChecksums(cwd, runId) {
    const store = new RunStore(cwd);
    const runPath = store.runPath(runId);
    const entries = [];
    for (const path of safeChecksumPaths) {
        const fullPath = join(runPath, path);
        if (!pathExists(fullPath))
            continue;
        const hash = await sha256File(fullPath);
        entries.push({ path, ...hash });
    }
    const manifest = {
        runId,
        createdAt: new Date().toISOString(),
        algorithm: "sha256",
        entries
    };
    await store.writeArtifact(runId, "provenance/checksums.json", manifest);
    await store.writeTextArtifact(runId, "provenance/CHECKSUMS.txt", entries.map((entry) => `${entry.sha256}  ${entry.path}`).join("\n") + "\n");
    await updateProvenanceState(store, runId, (provenance) => {
        provenance.checksums = { status: "generated" };
    });
    await writeLedgerManifest(cwd, runId);
    return manifest;
}
export async function verifyChecksums(cwd, runId) {
    const store = new RunStore(cwd);
    const manifest = await readJson(join(store.runPath(runId), "provenance", "checksums.json"));
    const checks = await Promise.all(manifest.entries.map(async (entry) => {
        if (entry.path === "ledger-manifest.json") {
            return {
                path: entry.path,
                ok: true,
                message: "ledger manifest is verified through vibe ledger because it is recomputed after provenance operations"
            };
        }
        const fullPath = join(store.runPath(runId), entry.path);
        if (!pathExists(fullPath))
            return { path: entry.path, ok: false, message: "missing" };
        const hash = await sha256File(fullPath);
        return {
            path: entry.path,
            ok: hash.sha256 === entry.sha256 && hash.sizeBytes === entry.sizeBytes,
            message: hash.sha256 === entry.sha256 && hash.sizeBytes === entry.sizeBytes
                ? "ok"
                : "hash mismatch"
        };
    }));
    const ok = checks.every((check) => check.ok);
    await updateProvenanceState(store, runId, (provenance) => {
        provenance.checksums = { status: ok ? "verified" : "invalid" };
    });
    return { runId, ok, checks };
}
//# sourceMappingURL=checksums.js.map