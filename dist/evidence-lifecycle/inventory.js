import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { sha256File } from "../ledger/hash.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { RunStore } from "../orchestrator/run-store.js";
import { ensureDir, pathExists } from "../utils/fs.js";
import { classifyEvidencePath, classifySensitivity, recommendedRetention } from "./classifier.js";
import { appendRetentionLedgerEvent } from "./retention-ledger.js";
import { updateEvidenceLifecycleState } from "./state.js";
const sampleLimit = 8192;
export async function generateEvidenceInventory(cwd, runId, options = {}) {
    const store = new RunStore(cwd);
    const runPath = store.runPath(runId);
    const files = await collectFiles(runPath);
    const inventoryFiles = [];
    for (const file of files) {
        const rel = relative(runPath, file).replace(/\\/g, "/");
        const hash = await sha256File(file);
        const shouldRead = options.deep || hash.sizeBytes <= sampleLimit;
        const sample = blockedWithoutRead(rel)
            ? ""
            : shouldRead
                ? await readFile(file, "utf8").catch(() => "")
                : "";
        const sensitivity = classifySensitivity(rel, sample.slice(0, sampleLimit));
        const evidenceClass = classifyEvidencePath(rel);
        inventoryFiles.push({
            path: rel,
            class: evidenceClass,
            sizeBytes: hash.sizeBytes,
            sha256: hash.sha256,
            sensitivity: sensitivity.sensitivity,
            includedInDefaultArchive: !sensitivity.excluded && includeByDefault(evidenceClass),
            excluded: sensitivity.excluded,
            exclusionReason: sensitivity.exclusionReason,
            warnings: sensitivity.warnings
        });
    }
    const classes = buildClasses(inventoryFiles);
    const inventory = {
        runId,
        createdAt: new Date().toISOString(),
        repoRoot: cwd,
        summary: {
            totalFiles: inventoryFiles.length,
            totalBytes: inventoryFiles.reduce((sum, file) => sum + file.sizeBytes, 0),
            includedFiles: inventoryFiles.filter((file) => file.includedInDefaultArchive).length,
            excludedFiles: inventoryFiles.filter((file) => file.excluded).length,
            secretLikeFindings: inventoryFiles.filter((file) => file.warnings.some((warning) => /secret/i.test(warning))).length,
            privateKeyFindings: inventoryFiles.filter((file) => /private key/i.test(file.exclusionReason ?? "")).length,
            envFileFindings: inventoryFiles.filter((file) => /\.env/.test(file.path) && !file.path.endsWith(".env.example")).length
        },
        classes,
        files: inventoryFiles,
        warnings: [
            "Evidence inventory is local retention evidence; no purge/delete or remote upload was performed."
        ]
    };
    await ensureDir(join(runPath, "evidence-lifecycle"));
    await store.writeArtifact(runId, "evidence-lifecycle/EVIDENCE_INVENTORY.json", inventory);
    await store.writeTextArtifact(runId, "evidence-lifecycle/EVIDENCE_INVENTORY.md", renderInventory(inventory));
    await updateEvidenceLifecycleState(store, runId, (state) => {
        state.inventory = {
            status: "generated",
            totalFiles: inventory.summary.totalFiles,
            totalBytes: inventory.summary.totalBytes,
            blockedFiles: inventory.files.filter((file) => file.sensitivity === "blocked").length
        };
    });
    await writeLedgerManifest(cwd, runId);
    await appendRetentionLedgerEvent(cwd, {
        eventType: "inventory_generated",
        runId,
        actor: null,
        summary: `Evidence inventory generated for ${runId}.`,
        artifactHashes: [
            {
                path: `.vibecli/runs/${runId}/evidence-lifecycle/EVIDENCE_INVENTORY.json`,
                sha256: (await sha256File(join(runPath, "evidence-lifecycle", "EVIDENCE_INVENTORY.json")))
                    .sha256
            }
        ]
    }).catch(() => undefined);
    return inventory;
}
export async function summarizeAllInventories(cwd) {
    const runsDir = join(cwd, ".vibecli", "runs");
    const entries = pathExists(runsDir) ? await readdir(runsDir, { withFileTypes: true }) : [];
    return {
        runs: await Promise.all(entries
            .filter((entry) => entry.isDirectory())
            .map(async (entry) => {
            const path = join(runsDir, entry.name, "evidence-lifecycle", "EVIDENCE_INVENTORY.json");
            if (!pathExists(path))
                return { runId: entry.name, status: "missing", totalFiles: null };
            const inventory = JSON.parse(await readFile(path, "utf8"));
            return {
                runId: entry.name,
                status: "generated",
                totalFiles: inventory.summary.totalFiles
            };
        }))
    };
}
async function collectFiles(root, dir = root) {
    const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
    const files = [];
    for (const entry of entries) {
        const path = join(dir, entry.name);
        const rel = relative(root, path).replace(/\\/g, "/");
        if (entry.isDirectory())
            files.push(...(await collectFiles(root, path)));
        else if (entry.isFile() && rel !== "evidence-lifecycle/EVIDENCE_INVENTORY.json")
            files.push(path);
    }
    return files;
}
function buildClasses(files) {
    const classes = [...new Set(files.map((file) => file.class))].sort();
    return classes.map((evidenceClass) => {
        const matching = files.filter((file) => file.class === evidenceClass);
        return {
            class: evidenceClass,
            files: matching.length,
            bytes: matching.reduce((sum, file) => sum + file.sizeBytes, 0),
            requiredForAudit: [
                "run-ledger",
                "handoff",
                "release",
                "provenance",
                "evidence",
                "organization",
                "audit"
            ].includes(evidenceClass),
            requiredForRelease: ["run-ledger", "release", "provenance", "evidence"].includes(evidenceClass),
            recommendedRetention: recommendedRetention(evidenceClass)
        };
    });
}
function blockedWithoutRead(path) {
    return path.endsWith(".private.pem") || /(^|\/)\.env($|\.)/.test(path);
}
function includeByDefault(evidenceClass) {
    return !["unknown", "console"].includes(evidenceClass);
}
function renderInventory(inventory) {
    return `# Evidence Inventory

Run id: ${inventory.runId}

Total files: ${inventory.summary.totalFiles}
Included in default archive: ${inventory.summary.includedFiles}
Excluded: ${inventory.summary.excludedFiles}
Blocked private keys: ${inventory.summary.privateKeyFindings}
Blocked env files: ${inventory.summary.envFileFindings}

Classes:
${inventory.classes.map((entry) => `- ${entry.class}: ${entry.files} files, ${entry.bytes} bytes`).join("\n")}

No evidence was deleted, purged, uploaded, or moved.
`;
}
//# sourceMappingURL=inventory.js.map