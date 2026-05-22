import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pathExists, readJson } from "../utils/fs.js";
import { validateSourcePath } from "../tools/source-write-policy.js";
import { RunStore } from "./run-store.js";
function now() {
    return new Date().toISOString();
}
export async function rollbackRun(cwd, runId, options) {
    const store = new RunStore(cwd);
    const startedAt = now();
    const result = {
        runId,
        status: options.dryRun ? "dry_run_passed" : "rolled_back",
        startedAt,
        finishedAt: startedAt,
        filesRestored: [],
        filesDeleted: [],
        errors: []
    };
    if (!options.dryRun && options.confirm !== `ROLLBACK ${runId}`) {
        throw new Error(`Refusing to rollback without exact confirmation: ROLLBACK ${runId}`);
    }
    const metadataPath = join(store.runPath(runId), "rollback", "pre-apply-metadata.json");
    if (!pathExists(metadataPath))
        throw new Error(`Rollback metadata not found for run ${runId}`);
    const metadata = await readJson(metadataPath);
    for (const file of metadata.filesBackedUp) {
        const safePath = validateSourcePath(file.path, { repoRoot: cwd, allowLockfiles: true });
        const target = join(cwd, safePath);
        if (file.existed && file.backupPath) {
            result.filesRestored.push(safePath);
            if (!options.dryRun) {
                await mkdir(dirname(target), { recursive: true });
                await writeFile(target, await readFile(join(store.runPath(runId), file.backupPath)));
            }
        }
        else {
            result.filesDeleted.push(safePath);
            if (!options.dryRun) {
                await rm(target, { force: true });
            }
        }
    }
    result.finishedAt = now();
    await store.writeArtifact(runId, "rollback-result.json", result);
    if (!options.dryRun) {
        const state = await store.readState(runId);
        state.apply = {
            status: "rolled_back",
            rolledBackAt: now(),
            filesChanged: [...result.filesRestored, ...result.filesDeleted]
        };
        state.updatedAt = now();
        const event = {
            timestamp: now(),
            type: "rollback",
            message: `Rollback restored ${result.filesRestored.length} files and deleted ${result.filesDeleted.length} created files`
        };
        state.events.push(event);
        await store.appendEvent(runId, event);
        await store.writeState(state);
    }
    return result;
}
//# sourceMappingURL=rollback.js.map