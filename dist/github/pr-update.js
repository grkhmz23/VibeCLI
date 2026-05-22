import { join } from "node:path";
import { createHandoffBundle } from "../handoff/bundle.js";
import { generatePrDescription } from "../handoff/pr-description.js";
import { verifyLedger } from "../ledger/verify.js";
import { refreshLedgerAfterOperation } from "../ledger/events.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists } from "../utils/fs.js";
import { githubDoctor, runGh } from "./gh.js";
export async function updateGithubPr(cwd, runId, options) {
    const expected = options.mode === "update"
        ? `UPDATE PR ${runId}`
        : options.mode === "comment"
            ? `COMMENT PR ${runId}`
            : `SYNC PR ${runId}`;
    if (options.confirm !== expected)
        throw new Error(`GitHub PR ${options.mode} requires exact confirmation: ${expected}`);
    const store = new RunStore(cwd);
    const state = await store.readState(runId);
    if (!pathExists(join(store.runPath(runId), "handoff", "PR_DESCRIPTION.md")))
        await createHandoffBundle(cwd, runId);
    const ledger = await verifyLedger(cwd, runId).catch(() => undefined);
    if (!ledger?.ok && !options.allowLedgerWarning)
        throw new Error("Refusing PR update because ledger verification failed.");
    if ((state.scanners?.criticalFindings || state.scanners?.highFindings) && !options.allowRisk)
        throw new Error("Refusing PR update because high/critical scanner findings exist.");
    if (state.verification?.status !== "passed" && !options.allowUnverified)
        throw new Error("Refusing PR update because verification has not passed.");
    const pr = await generatePrDescription(cwd, runId);
    const doctor = await githubDoctor(cwd);
    const result = {
        runId,
        createdAt: new Date().toISOString(),
        mode: options.mode === "sync" ? "synced" : options.mode === "update" ? "updated" : "commented",
        remote: doctor.remote,
        branch: doctor.branch,
        title: pr.title,
        bodyPath: pr.path,
        prUrl: null,
        warnings: doctor.messages,
        errors: []
    };
    const bodyPath = join(store.runPath(runId), "handoff", "PR_DESCRIPTION.md");
    if (options.mode === "update" || options.mode === "sync") {
        await runGh(["pr", "edit", options.pr, "--title", pr.title, "--body-file", bodyPath], cwd);
    }
    if (options.mode === "comment" || options.mode === "sync") {
        const commentPath = join(store.runPath(runId), "github", "PR_COMMENT.md");
        await store.writeTextArtifact(runId, "github/PR_COMMENT.md", `VibeCLI handoff updated for ${runId}.\n\nReadiness: ${state.readiness?.verdict ?? "unknown"}\n`);
        await runGh(["pr", "comment", options.pr, "--body-file", commentPath], cwd);
    }
    await store.writeArtifact(runId, "github-pr.json", result);
    state.lifecycle = {
        ...state.lifecycle,
        branch: state.lifecycle?.branch ?? { proposed: null, current: doctor.branch, created: false },
        commit: state.lifecycle?.commit ?? { status: "not_started" },
        pr: {
            status: result.mode === "synced"
                ? "updated"
                : result.mode === "push_required"
                    ? "failed"
                    : result.mode,
            url: result.prUrl ?? undefined,
            updatedAt: result.createdAt
        },
        feedback: state.lifecycle?.feedback ?? { status: "not_started" },
        mergeReadiness: state.lifecycle?.mergeReadiness ?? { verdict: "not_started" }
    };
    await store.writeState(state);
    await refreshLedgerAfterOperation(cwd, runId);
    return result;
}
//# sourceMappingURL=pr-update.js.map