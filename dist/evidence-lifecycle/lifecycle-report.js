import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { RunStore } from "../orchestrator/run-store.js";
import { ensureDir, pathExists, readJson, writeJson } from "../utils/fs.js";
import { readRetentionLedger } from "./retention-ledger.js";
import { defaultEvidenceLifecycleState, updateEvidenceLifecycleState } from "./state.js";
export async function createEvidenceLifecycleReport(cwd, runId) {
    const store = new RunStore(cwd);
    const runPath = store.runPath(runId);
    const state = await store.readState(runId);
    const lifecycle = state.evidenceLifecycle ?? defaultEvidenceLifecycleState();
    const inventory = await readOptional(join(runPath, "evidence-lifecycle", "EVIDENCE_INVENTORY.json"));
    const legalHold = await readOptional(join(runPath, "evidence-lifecycle", "LEGAL_HOLD.json"));
    const retentionPlan = await readOptional(join(runPath, "org", "RETENTION_PLAN.json"));
    const { chain } = await readRetentionLedger(cwd).catch(() => ({ chain: [] }));
    const latestRunChain = [...chain].reverse().find((entry) => entry.runId === runId);
    const report = {
        runId,
        createdAt: new Date().toISOString(),
        inventory: {
            status: inventory ? "generated" : lifecycle.inventory.status,
            totalFiles: inventory?.summary.totalFiles ?? lifecycle.inventory.totalFiles ?? 0,
            totalBytes: inventory?.summary.totalBytes ?? lifecycle.inventory.totalBytes ?? 0,
            blockedFiles: inventory?.files.filter((file) => file.sensitivity === "blocked").length ??
                lifecycle.inventory.blockedFiles ??
                0
        },
        retention: {
            status: retentionPlan ? "planned" : (state.organization?.retention.status ?? null),
            policy: retentionPlan?.policy ?? state.organization?.retention.policy ?? null,
            retainUntil: retentionPlan?.retainUntil ?? state.organization?.retention.retainUntil ?? null,
            legalHold: legalHold?.status === "enabled" || retentionPlan?.legalHold || null
        },
        archive: {
            status: lifecycle.archive.status,
            mode: lifecycle.archive.mode ?? null,
            archivePath: lifecycle.archive.archivePath ?? null,
            archiveSha256: lifecycle.archive.archiveSha256 ?? null
        },
        legalHold: {
            status: legalHold?.status ?? lifecycle.legalHold.status,
            reasonHash: legalHold?.reasonHash ?? null,
            enabledAt: legalHold?.enabledAt ?? lifecycle.legalHold.enabledAt ?? null,
            releasedAt: legalHold?.releasedAt ?? lifecycle.legalHold.releasedAt ?? null
        },
        retentionLedger: {
            status: latestRunChain ? "recorded" : lifecycle.retentionLedger.status,
            latestChainHash: latestRunChain?.chainHash ?? lifecycle.retentionLedger.latestChainHash ?? null
        },
        compaction: {
            status: lifecycle.compaction.status,
            estimatedSavingsBytes: lifecycle.compaction.estimatedSavingsBytes ?? null
        },
        nextActions: [
            `vibe evidence-inventory ${runId}`,
            `vibe retention-enforce ${runId}`,
            `vibe evidence-archive ${runId}`,
            `vibe retention-ledger ${runId} --verify`
        ],
        warnings: ["Evidence lifecycle report is local-only. No evidence was deleted or uploaded."]
    };
    await store.writeArtifact(runId, "evidence-lifecycle/EVIDENCE_LIFECYCLE.json", report);
    await store.writeTextArtifact(runId, "evidence-lifecycle/EVIDENCE_LIFECYCLE.md", renderLifecycleReport(report));
    await updateEvidenceLifecycleState(store, runId, (next) => {
        next.retentionLedger = {
            status: latestRunChain ? "recorded" : next.retentionLedger.status,
            latestChainHash: latestRunChain?.chainHash ?? next.retentionLedger.latestChainHash
        };
        next.report = { status: "generated" };
    });
    await writeLedgerManifest(cwd, runId);
    return report;
}
export async function createEvidenceLifecycleIndex(cwd) {
    const runsDir = join(cwd, ".vibecli", "runs");
    const entries = pathExists(runsDir) ? await readdir(runsDir, { withFileTypes: true }) : [];
    const runs = await Promise.all(entries
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => {
        const state = await new RunStore(cwd).readState(entry.name).catch(() => undefined);
        const lifecycle = state?.evidenceLifecycle ?? defaultEvidenceLifecycleState();
        return {
            runId: entry.name,
            inventory: lifecycle.inventory.status,
            archive: lifecycle.archive.status,
            legalHold: lifecycle.legalHold.status,
            retentionLedger: lifecycle.retentionLedger.status,
            compaction: lifecycle.compaction.status
        };
    }));
    const index = { createdAt: new Date().toISOString(), runs };
    const dir = join(cwd, ".vibecli", "evidence-lifecycle");
    await ensureDir(dir);
    await writeJson(join(dir, "EVIDENCE_LIFECYCLE_INDEX.json"), index);
    await import("node:fs/promises").then((fs) => fs.writeFile(join(dir, "EVIDENCE_LIFECYCLE_INDEX.md"), renderLifecycleIndex(index), "utf8"));
    return index;
}
async function readOptional(path) {
    return pathExists(path) ? readJson(path).catch(() => undefined) : undefined;
}
function renderLifecycleReport(report) {
    return `# Evidence Lifecycle

Run id: ${report.runId}

Inventory: ${report.inventory.status} (${report.inventory.totalFiles} files, ${report.inventory.totalBytes} bytes)
Retention: ${report.retention.status ?? "not_started"} (${report.retention.policy ?? "none"})
Archive: ${report.archive.status} (${report.archive.archivePath ?? "none"})
Legal hold: ${report.legalHold.status}
Retention ledger: ${report.retentionLedger.status}
Compaction: ${report.compaction.status}

No evidence was deleted, purged, uploaded, or moved.
`;
}
function renderLifecycleIndex(index) {
    return `# Evidence Lifecycle Index

${index.runs.map((run) => `- ${run.runId}: archive=${run.archive}`).join("\n") || "- no runs"}
`;
}
//# sourceMappingURL=lifecycle-report.js.map