import { readdir } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { sha256File } from "../ledger/hash.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists } from "../utils/fs.js";
import { appendRetentionLedgerEvent } from "../evidence-lifecycle/retention-ledger.js";
import { updateEvidenceDisposalState } from "./state.js";
import { classifyDisposalPath, conservativeCandidateReason, isProtectedDisposalPath } from "./classifier.js";
export async function buildDisposalCandidates(cwd, runId) {
    const store = new RunStore(cwd);
    const runPath = store.runPath(runId);
    const files = await collectFiles(runPath);
    const candidates = [];
    const blocked = [];
    for (const fullPath of files) {
        const rel = relative(runPath, fullPath).replace(/\\/g, "/");
        const disposalClass = classifyDisposalPath(rel);
        const inside = isInside(runPath, fullPath);
        const reason = conservativeCandidateReason(rel);
        if (!inside || isProtectedDisposalPath(rel) || !reason) {
            blocked.push({
                path: rel,
                class: disposalClass,
                reason: inside
                    ? "Protected or not conservative for Phase 15 disposal."
                    : "Outside run directory."
            });
            continue;
        }
        const hash = await sha256File(fullPath);
        candidates.push({
            path: rel,
            class: disposalClass,
            sizeBytes: hash.sizeBytes,
            sha256: hash.sha256,
            reason,
            safeToDelete: true
        });
    }
    const blockedBytes = await blockedSize(runPath, blocked.map((entry) => entry.path));
    const result = {
        runId,
        createdAt: new Date().toISOString(),
        scope: "run-evidence-only",
        summary: {
            candidateFiles: candidates.length,
            candidateBytes: candidates.reduce((sum, entry) => sum + entry.sizeBytes, 0),
            blockedFiles: blocked.length,
            blockedBytes
        },
        candidates,
        blocked,
        warnings: [
            "Candidate classification is conservative. Source files, archives, keys, env files, and global ledgers are blocked."
        ]
    };
    await store.writeArtifact(runId, "evidence-lifecycle/disposal/DISPOSAL_CANDIDATES.json", result);
    await store.writeTextArtifact(runId, "evidence-lifecycle/disposal/DISPOSAL_CANDIDATES.md", renderCandidates(result));
    await updateEvidenceDisposalState(store, runId, (state) => {
        state.candidates = {
            status: "generated",
            files: result.summary.candidateFiles,
            bytes: result.summary.candidateBytes
        };
    });
    await writeLedgerManifest(cwd, runId).catch(() => undefined);
    await appendRetentionLedgerEvent(cwd, {
        eventType: "disposal_candidates_generated",
        runId,
        actor: null,
        summary: `Generated ${candidates.length} local disposal candidates.`,
        artifactHashes: []
    }).catch(() => undefined);
    return result;
}
async function collectFiles(root, dir = root) {
    const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
    const files = [];
    for (const entry of entries) {
        const path = join(dir, entry.name);
        if (entry.isDirectory())
            files.push(...(await collectFiles(root, path)));
        else if (entry.isFile())
            files.push(path);
    }
    return files;
}
async function blockedSize(runPath, paths) {
    let total = 0;
    for (const path of paths) {
        const fullPath = join(runPath, path);
        if (pathExists(fullPath))
            total += (await sha256File(fullPath).catch(() => ({ sizeBytes: 0 }))).sizeBytes;
    }
    return total;
}
function isInside(root, path) {
    const rel = relative(resolve(root), resolve(path));
    return rel === "" || (!rel.startsWith("..") && !rel.startsWith("/"));
}
function renderCandidates(result) {
    return `# Disposal Candidates

Run id: ${result.runId}
Candidate files: ${result.summary.candidateFiles}
Candidate bytes: ${result.summary.candidateBytes}
Blocked files: ${result.summary.blockedFiles}

No evidence was deleted.
`;
}
//# sourceMappingURL=candidates.js.map