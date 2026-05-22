import { unlink, rmdir } from "node:fs/promises";
import { join, dirname, relative, resolve } from "node:path";
import { sha256File } from "../ledger/hash.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { appendRetentionLedgerEvent } from "../evidence-lifecycle/retention-ledger.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists, readJson } from "../utils/fs.js";
import { isProtectedDisposalPath } from "./classifier.js";
import { runDisposalPrecheck } from "./predelete.js";
import { updateEvidenceDisposalState } from "./state.js";
export async function dryRunDisposal(cwd, runId) {
    const precheck = await runDisposalPrecheck(cwd, runId);
    const store = new RunStore(cwd);
    const plan = await readJson(join(store.runPath(runId), "evidence-lifecycle", "disposal", "DISPOSAL_PLAN.json")).catch(() => undefined);
    const result = { runId, ok: precheck.ok, candidates: plan?.candidates.length ?? 0 };
    await store.writeArtifact(runId, "evidence-lifecycle/disposal/DISPOSAL_DRY_RUN.json", result);
    await updateEvidenceDisposalState(store, runId, (state) => {
        state.execution = { status: "dry_run" };
    });
    await writeLedgerManifest(cwd, runId).catch(() => undefined);
    return result;
}
export async function executeDisposal(cwd, runId, options) {
    if (options.confirm !== `DELETE EVIDENCE ${runId}`) {
        throw new Error(`Evidence disposal requires exact confirmation: DELETE EVIDENCE ${runId}`);
    }
    const precheck = await runDisposalPrecheck(cwd, runId);
    if (!precheck.ok)
        throw new Error("Disposal precheck failed; no evidence was deleted.");
    const store = new RunStore(cwd);
    const runPath = store.runPath(runId);
    const plan = await readJson(join(runPath, "evidence-lifecycle", "disposal", "DISPOSAL_PLAN.json"));
    const deleted = [];
    const failed = [];
    const skipped = [];
    const archiveVerifiedBeforeDelete = precheck.checks.find((check) => check.name === "archive verified")?.ok ?? false;
    const legalHoldAtDeleteTime = !precheck.checks.find((check) => check.name === "legal hold not enabled")?.ok;
    for (const candidate of plan.candidates) {
        const fullPath = join(runPath, candidate.path);
        if (!isInside(runPath, fullPath) || isProtectedDisposalPath(candidate.path)) {
            skipped.push({ path: candidate.path, reason: "Protected or outside run evidence scope." });
            continue;
        }
        if (!pathExists(fullPath)) {
            failed.push({ path: candidate.path, reason: "Candidate file missing before deletion." });
            continue;
        }
        const hash = await sha256File(fullPath);
        if (hash.sha256 !== candidate.sha256 || hash.sizeBytes !== candidate.sizeBytes) {
            failed.push({ path: candidate.path, reason: "Candidate hash changed before deletion." });
            continue;
        }
        try {
            await unlink(fullPath);
            await removeEmptyParents(dirname(fullPath), runPath);
            deleted.push({
                path: candidate.path,
                sha256BeforeDelete: hash.sha256,
                sizeBytes: hash.sizeBytes,
                deleted: true,
                verifiedMissing: !pathExists(fullPath)
            });
        }
        catch (error) {
            failed.push({
                path: candidate.path,
                reason: error instanceof Error ? error.message : String(error)
            });
        }
    }
    const status = failed.length > 0 ? (deleted.length > 0 ? "partial" : "failed") : "completed";
    let receipt = {
        runId,
        createdAt: new Date().toISOString(),
        status,
        scope: "run-evidence-only",
        deleted,
        skipped,
        failed,
        archiveVerifiedBeforeDelete,
        legalHoldAtDeleteTime: Boolean(legalHoldAtDeleteTime),
        retentionLedgerEventHash: null,
        recoveryGuidancePath: `.vibecli/runs/${runId}/evidence-lifecycle/disposal/RECOVERY_GUIDANCE.md`,
        warnings: [
            "Local deletion receipt only. VibeCLI did not delete source code, archives, keys, or remote evidence."
        ]
    };
    await store.writeArtifact(runId, "evidence-lifecycle/disposal/DISPOSAL_RECEIPT.json", receipt);
    await store.writeTextArtifact(runId, "evidence-lifecycle/disposal/RECOVERY_GUIDANCE.md", recoveryGuidance(runId));
    const entry = await appendRetentionLedgerEvent(cwd, {
        eventType: "disposal_executed",
        runId,
        actor: null,
        summary: `Local disposal ${status}; deleted ${deleted.length} files.`,
        artifactHashes: []
    }).catch(() => undefined);
    receipt = { ...receipt, retentionLedgerEventHash: entry?.eventHash ?? null };
    await store.writeArtifact(runId, "evidence-lifecycle/disposal/DISPOSAL_RECEIPT.json", receipt);
    await store.writeTextArtifact(runId, "evidence-lifecycle/disposal/DISPOSAL_RECEIPT.md", renderReceipt(receipt));
    const receiptHash = (await sha256File(join(runPath, "evidence-lifecycle", "disposal", "DISPOSAL_RECEIPT.json"))).sha256;
    const deletedArtifacts = {
        runId,
        createdAt: new Date().toISOString(),
        deletedArtifacts: deleted.map((entry) => ({
            path: entry.path,
            sha256BeforeDelete: entry.sha256BeforeDelete,
            sizeBytes: entry.sizeBytes,
            receiptSha256: receiptHash
        }))
    };
    await store.writeArtifact(runId, "evidence-lifecycle/disposal/DELETED_ARTIFACTS.json", deletedArtifacts);
    await appendRetentionLedgerEvent(cwd, {
        eventType: "disposal_receipt_recorded",
        runId,
        actor: null,
        summary: "Disposal receipt recorded.",
        artifactHashes: [
            {
                path: `.vibecli/runs/${runId}/evidence-lifecycle/disposal/DISPOSAL_RECEIPT.json`,
                sha256: receiptHash
            }
        ]
    }).catch(() => undefined);
    await updateEvidenceDisposalState(store, runId, (state) => {
        state.execution = {
            status,
            deletedFiles: deleted.length,
            deletedBytes: deleted.reduce((sum, entry) => sum + entry.sizeBytes, 0),
            executedAt: receipt.createdAt
        };
        state.ledger = { status: "recorded" };
    });
    await writeLedgerManifest(cwd, runId).catch(() => undefined);
    return receipt;
}
async function removeEmptyParents(dir, stopAt) {
    let current = dir;
    while (isInside(stopAt, current) && current !== resolve(stopAt)) {
        await rmdir(current).catch(() => undefined);
        current = dirname(current);
    }
}
function isInside(root, path) {
    const rel = relative(resolve(root), resolve(path));
    return rel === "" || (!rel.startsWith("..") && !rel.startsWith("/"));
}
function recoveryGuidance(runId) {
    return `# Recovery Guidance

This was local deletion for run ${runId}. VibeCLI cannot guarantee recovery.

Check VCS, local backups, filesystem backups, CI artifacts, evidence archives, handoff bundles, release packets, and evidence exports.

VibeCLI did not delete source code, archives, or keys. VibeCLI did not perform remote deletion.
`;
}
function renderReceipt(receipt) {
    return `# Disposal Receipt

Run id: ${receipt.runId}
Status: ${receipt.status}
Deleted files: ${receipt.deleted.length}
Skipped files: ${receipt.skipped.length}
Failed files: ${receipt.failed.length}

This is a local deletion receipt, not immutable deletion proof.
`;
}
//# sourceMappingURL=delete.js.map