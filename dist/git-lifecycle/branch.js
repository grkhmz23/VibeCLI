import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { loadConfig } from "../config/config.js";
import { refreshLedgerAfterOperation } from "../ledger/events.js";
import { RunStore } from "../orchestrator/run-store.js";
import { branchExists, currentBranch, isDirty } from "./status.js";
import { validateBranchName, validateBranchPrefix } from "./validation.js";
const execFileAsync = promisify(execFile);
function slug(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48);
}
export async function proposedBranchName(cwd, runId, custom) {
    if (custom)
        return validateBranchName(custom);
    const config = await loadConfig(cwd);
    const state = await new RunStore(cwd).readState(runId);
    const prefix = validateBranchPrefix(config.git_lifecycle.branch_prefix);
    const date = state.createdAt.slice(0, 10).replaceAll("-", "");
    const base = `${prefix}/${date}-${slug(state.prompt) || "change"}`.slice(0, 80);
    return (await branchExists(cwd, base))
        ? validateBranchName(`${base.slice(0, 72)}-${runId.slice(-6)}`)
        : validateBranchName(base);
}
export async function branchRun(cwd, runId, options = {}) {
    const config = await loadConfig(cwd);
    const branch = await proposedBranchName(cwd, runId, options.name);
    const previousBranch = await currentBranch(cwd);
    const dirty = await isDirty(cwd);
    const warnings = [];
    const errors = [];
    const protectedBranch = previousBranch
        ? config.git_lifecycle.protected_branches.includes(previousBranch)
        : false;
    if (protectedBranch)
        warnings.push(`Current branch ${previousBranch} is protected.`);
    if (dirty)
        warnings.push("Working tree is dirty.");
    let mode = "preview";
    if (options.create) {
        if (options.confirm !== `CREATE BRANCH ${runId}`)
            throw new Error(`Branch creation requires exact confirmation: CREATE BRANCH ${runId}`);
        if (dirty &&
            !options.allowDirty &&
            !config.git_lifecycle.allow_dirty_worktree_for_branch_create) {
            throw new Error("Refusing branch creation with dirty working tree.");
        }
        if (await branchExists(cwd, branch)) {
            if (!options.switchExisting)
                throw new Error(`Branch ${branch} already exists.`);
            await execFileAsync("git", ["checkout", branch], { cwd });
            mode = "switched_existing";
        }
        else {
            await execFileAsync("git", ["checkout", "-b", branch], { cwd });
            mode = "created";
        }
    }
    const result = {
        runId,
        createdAt: new Date().toISOString(),
        mode,
        branch,
        previousBranch,
        currentBranch: await currentBranch(cwd),
        warnings,
        errors
    };
    await new RunStore(cwd).writeArtifact(runId, "git/branch-result.json", result);
    const state = await new RunStore(cwd).readState(runId);
    state.lifecycle = {
        ...state.lifecycle,
        branch: {
            proposed: branch,
            current: result.currentBranch,
            created: mode === "created" || mode === "switched_existing",
            createdAt: mode === "created" || mode === "switched_existing" ? result.createdAt : undefined
        },
        commit: state.lifecycle?.commit ?? { status: "not_started" },
        pr: state.lifecycle?.pr ?? { status: "not_started" },
        feedback: state.lifecycle?.feedback ?? { status: "not_started" },
        mergeReadiness: state.lifecycle?.mergeReadiness ?? { verdict: "not_started" }
    };
    await new RunStore(cwd).writeState(state);
    await refreshLedgerAfterOperation(cwd, runId);
    return result;
}
//# sourceMappingURL=branch.js.map