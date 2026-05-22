import { join } from "node:path";
import { sha256File } from "../ledger/hash.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists, readJson } from "../utils/fs.js";
import { loadEvidenceLifecycleConfig } from "./config.js";
import { generateEvidenceInventory } from "./inventory.js";
import { appendRetentionLedgerEvent } from "./retention-ledger.js";
import { updateEvidenceLifecycleState } from "./state.js";
export async function previewRetentionEnforcement(cwd, runId, options = {}) {
    const store = new RunStore(cwd);
    const runPath = store.runPath(runId);
    const config = await loadEvidenceLifecycleConfig(cwd);
    const inventoryPath = join(runPath, "evidence-lifecycle", "EVIDENCE_INVENTORY.json");
    const inventory = pathExists(inventoryPath)
        ? await readJson(inventoryPath)
        : await generateEvidenceInventory(cwd, runId);
    const legalHold = await readLegalHold(runPath);
    const eligibleForArchive = inventory.files
        .filter((file) => file.includedInDefaultArchive && !file.excluded)
        .map((file) => ({
        path: file.path,
        class: file.class,
        reason: "Included in redacted local archive mode."
    }));
    const blockedFromArchive = inventory.files
        .filter((file) => file.excluded || file.sensitivity === "blocked")
        .map((file) => ({
        path: file.path,
        reason: file.exclusionReason ?? "Excluded by lifecycle policy."
    }));
    const preview = {
        runId,
        createdAt: new Date().toISOString(),
        policy: options.policy ?? null,
        legalHold: legalHold?.status === "enabled",
        archiveRecommended: eligibleForArchive.length > 0,
        archiveMode: config.default_archive_mode,
        eligibleForArchive,
        blockedFromArchive,
        purgeCandidates: legalHold?.status === "enabled"
            ? []
            : inventory.files
                .filter((file) => file.excluded)
                .map((file) => ({
                path: file.path,
                eligibleAfter: null,
                reason: "Purge/delete is not implemented in Phase 14."
            })),
        purgeImplemented: false,
        warnings: [
            "Purge/delete is not implemented in Phase 14.",
            "Retention enforcement preview did not delete, archive, upload, or modify source files."
        ],
        nextActions: [
            `vibe evidence-archive ${runId}`,
            `vibe evidence-archive ${runId} --create --confirm "ARCHIVE EVIDENCE ${runId}"`
        ]
    };
    await store.writeArtifact(runId, "evidence-lifecycle/RETENTION_ENFORCEMENT_PREVIEW.json", preview);
    await store.writeTextArtifact(runId, "evidence-lifecycle/RETENTION_ENFORCEMENT_PREVIEW.md", renderPreview(preview));
    await updateEvidenceLifecycleState(store, runId, (state) => {
        state.retentionEnforcement = {
            status: "previewed",
            archiveRecommended: preview.archiveRecommended,
            purgeImplemented: false
        };
    });
    await writeLedgerManifest(cwd, runId);
    await appendRetentionLedgerEvent(cwd, {
        eventType: "retention_previewed",
        runId,
        actor: null,
        summary: "Retention enforcement preview generated.",
        artifactHashes: [
            {
                path: `.vibecli/runs/${runId}/evidence-lifecycle/RETENTION_ENFORCEMENT_PREVIEW.json`,
                sha256: (await sha256File(join(runPath, "evidence-lifecycle", "RETENTION_ENFORCEMENT_PREVIEW.json"))).sha256
            }
        ]
    }).catch(() => undefined);
    return preview;
}
async function readLegalHold(runPath) {
    const path = join(runPath, "evidence-lifecycle", "LEGAL_HOLD.json");
    return pathExists(path) ? readJson(path).catch(() => undefined) : undefined;
}
function renderPreview(preview) {
    return `# Retention Enforcement Preview

Run id: ${preview.runId}

Archive recommended: ${preview.archiveRecommended}
Archive mode: ${preview.archiveMode}
Legal hold: ${preview.legalHold}
Purge implemented: false

Purge/delete is not implemented in Phase 14.

Eligible for archive:
${preview.eligibleForArchive.map((file) => `- ${file.path}`).join("\n") || "- none"}

Blocked from archive:
${preview.blockedFromArchive.map((file) => `- ${file.path}: ${file.reason}`).join("\n") || "- none"}
`;
}
//# sourceMappingURL=retention-enforcement.js.map