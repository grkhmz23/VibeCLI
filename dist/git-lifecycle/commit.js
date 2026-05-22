import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { join } from "node:path";
import { loadConfig } from "../config/config.js";
import { verifyLedger } from "../ledger/verify.js";
import { refreshLedgerAfterOperation } from "../ledger/events.js";
import { RunStore } from "../orchestrator/run-store.js";
import { validatePatchContent, validateSourcePath } from "../tools/source-write-policy.js";
import { pathExists, readJson } from "../utils/fs.js";
import { generateCommitMessage } from "./commit-message.js";
import { currentBranch, isDirty, gitHead } from "./status.js";
const execFileAsync = promisify(execFile);
async function safeAppliedFiles(cwd, runId) {
    const store = new RunStore(cwd);
    const apply = await readJson(join(store.runPath(runId), "apply-result.json")).catch(() => undefined);
    const files = apply?.filesChanged ?? (await store.readState(runId)).apply.filesChanged;
    const accepted = [];
    const rejected = [];
    for (const file of files) {
        try {
            const normalized = validateSourcePath(file, { repoRoot: cwd, allowLockfiles: true });
            const fullPath = join(cwd, normalized);
            if (pathExists(fullPath)) {
                validatePatchContent(await readFile(fullPath, "utf8").catch(() => ""));
            }
            accepted.push(normalized);
        }
        catch (error) {
            rejected.push({ path: file, reason: error instanceof Error ? error.message : String(error) });
        }
    }
    return { accepted, rejected };
}
export async function commitRun(cwd, runId, options = {}) {
    const config = await loadConfig(cwd);
    const store = new RunStore(cwd);
    const state = await store.readState(runId);
    const message = await generateCommitMessage(cwd, runId);
    const branch = await currentBranch(cwd);
    const files = await safeAppliedFiles(cwd, runId);
    const warnings = [];
    const errors = [];
    if (state.apply.status !== "applied")
        errors.push("Run has not been applied.");
    const ledger = await verifyLedger(cwd, runId).catch(() => undefined);
    if (!ledger?.ok)
        errors.push("Ledger verification failed.");
    if (state.verification?.status !== "passed")
        errors.push("Verification has not passed.");
    if (state.scanners?.criticalFindings || state.scanners?.highFindings)
        errors.push("High or critical scanner findings exist.");
    if (branch && config.git_lifecycle.protected_branches.includes(branch))
        errors.push(`Current branch ${branch} is protected.`);
    if (await isDirty(cwd))
        warnings.push("Working tree is dirty.");
    if (options.includeHandoffArtifacts) {
        for (const handoff of [
            "handoff/HANDOFF.md",
            "handoff/PR_DESCRIPTION.md",
            "handoff/REVIEW_CHECKLIST.md"
        ]) {
            const full = join(store.runPath(runId), handoff);
            if (pathExists(full))
                files.accepted.push(join(".vibecli", "runs", runId, handoff));
        }
    }
    const blocking = errors.filter((error) => {
        if (error.includes("not been applied"))
            return !options.allowUnapplied && config.git_lifecycle.require_applied_before_commit;
        if (error.includes("Ledger"))
            return !options.allowLedgerWarning && config.git_lifecycle.require_ledger_pass_before_commit;
        if (error.includes("Verification"))
            return !options.allowUnverified && config.git_lifecycle.require_verification_before_commit;
        if (error.includes("scanner"))
            return (!options.allowRisk && config.git_lifecycle.require_scanner_no_high_or_critical_before_commit);
        if (error.includes("protected"))
            return (!options.allowProtectedBranch && !config.git_lifecycle.allow_commit_on_protected_branch);
        return true;
    });
    let mode = "preview";
    let commitSha = null;
    if (options.create) {
        if (options.confirm !== `COMMIT ${runId}`)
            throw new Error(`Commit requires exact confirmation: COMMIT ${runId}`);
        if (blocking.length)
            throw new Error(`Refusing commit: ${blocking.join("; ")}`);
        if ((await isDirty(cwd)) &&
            !options.allowDirty &&
            !config.git_lifecycle.allow_dirty_worktree_for_commit) {
            const status = await execFileAsync("git", ["status", "--short"], { cwd }).then(({ stdout }) => stdout.trim().split("\n").filter(Boolean));
            const allowed = new Set(files.accepted);
            const unrelated = status.filter((line) => !allowed.has(line.slice(3).trim()));
            if (unrelated.length)
                throw new Error("Refusing commit with unrelated dirty worktree changes.");
        }
        if (!files.accepted.length)
            throw new Error("No safe applied files to stage.");
        await execFileAsync("git", ["add", "--", ...files.accepted], { cwd });
        await execFileAsync("git", ["commit", "-F", join(store.runPath(runId), "git", "COMMIT_MESSAGE.md")], { cwd });
        commitSha = await gitHead(cwd);
        mode = "created";
    }
    const result = {
        runId,
        createdAt: new Date().toISOString(),
        mode,
        branch,
        commitSha,
        subject: message.subject,
        filesStaged: options.create ? files.accepted : [],
        filesRejected: files.rejected,
        warnings,
        errors: blocking
    };
    await store.writeArtifact(runId, "git/commit-result.json", result);
    state.lifecycle = {
        ...state.lifecycle,
        branch: state.lifecycle?.branch ?? { proposed: null, current: branch, created: false },
        commit: {
            status: mode === "created" ? "created" : "previewed",
            commitSha: commitSha ?? undefined,
            committedAt: mode === "created" ? result.createdAt : undefined
        },
        pr: state.lifecycle?.pr ?? { status: "not_started" },
        feedback: state.lifecycle?.feedback ?? { status: "not_started" },
        mergeReadiness: state.lifecycle?.mergeReadiness ?? { verdict: "not_started" }
    };
    await store.writeState(state);
    await refreshLedgerAfterOperation(cwd, runId);
    return result;
}
//# sourceMappingURL=commit.js.map