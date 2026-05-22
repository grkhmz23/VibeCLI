import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { loadConfig } from "../config/config.js";
import { validateBranchName } from "../git-lifecycle/validation.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { RunStore } from "../orchestrator/run-store.js";
import { updateReleaseState } from "./state.js";
import { readJson } from "../utils/fs.js";
import { join } from "node:path";
const execFileAsync = promisify(execFile);
async function git(args, cwd) {
    return execFileAsync("git", args, { cwd })
        .then(({ stdout }) => stdout.trim() || null)
        .catch(() => null);
}
async function dirty(cwd) {
    return Boolean(await git(["status", "--short"], cwd));
}
export async function releaseBranchRun(cwd, runId, options = {}) {
    const config = await loadConfig(cwd);
    const store = new RunStore(cwd);
    const version = await readJson(join(store.runPath(runId), "release", "version-plan.json")).catch(() => undefined);
    const short = runId.split("-").at(-1) ?? runId.slice(-6);
    const base = version?.plannedVersion ?? new Date().toISOString().slice(0, 10).replaceAll("-", "");
    const branch = `${config.release.release_branch.prefix}/${base}-${short}`;
    validateBranchName(branch);
    const current = await git(["branch", "--show-current"], cwd);
    const result = {
        runId,
        createdAt: new Date().toISOString(),
        mode: "preview",
        branch,
        previousBranch: current,
        currentBranch: current,
        targetChannel: options.channel ?? config.release.default_channel,
        warnings: [],
        errors: []
    };
    if (!options.create) {
        await store.writeArtifact(runId, "release/release-branch.json", result);
        await updateReleaseState(store, runId, (release) => {
            release.releaseBranch = { status: "previewed", branch };
        });
        await writeLedgerManifest(cwd, runId);
        return result;
    }
    if (options.confirm !== `CREATE RELEASE BRANCH ${runId}`) {
        throw new Error(`Release branch creation requires exact confirmation: CREATE RELEASE BRANCH ${runId}`);
    }
    if ((await dirty(cwd)) && !options.allowDirty) {
        result.mode = "failed";
        result.errors.push("Dirty worktree requires --allow-dirty");
    }
    else {
        await execFileAsync("git", ["checkout", "-b", branch], { cwd });
        result.mode = "created";
        result.currentBranch = branch;
    }
    await store.writeArtifact(runId, "release/release-branch.json", result);
    await updateReleaseState(store, runId, (release) => {
        release.releaseBranch = {
            status: result.mode === "created" ? "created" : "failed",
            branch
        };
    });
    await writeLedgerManifest(cwd, runId);
    return result;
}
//# sourceMappingURL=release-branch.js.map