import { join } from "node:path";
import { verifyLedger } from "../ledger/verify.js";
import { readPolicyExceptions } from "../handoff/policy-exceptions.js";
import { refreshLedgerAfterOperation } from "../ledger/events.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists, readJson } from "../utils/fs.js";
import { ingestGithubFeedback } from "../reviewer-feedback/github.js";
import { isDirty } from "./status.js";
export async function evaluateMergeReadiness(cwd, runId, options = {}) {
    const store = new RunStore(cwd);
    const state = await store.readState(runId);
    const runPath = store.runPath(runId);
    if (options.github) {
        if (options.confirm !== `CHECK PR ${runId}`) {
            throw new Error(`GitHub merge-readiness check requires exact confirmation: CHECK PR ${runId}`);
        }
        await ingestGithubFeedback(cwd, runId, options.pr ?? "", `INGEST FEEDBACK ${runId}`);
    }
    const feedback = pathExists(join(runPath, "reviewer-feedback.json"))
        ? await readJson(join(runPath, "reviewer-feedback.json"))
        : undefined;
    const githubPr = pathExists(join(runPath, "github-pr.json"))
        ? await readJson(join(runPath, "github-pr.json"))
        : undefined;
    const blockingReasons = [];
    const warnings = [];
    const passed = [];
    if (state.apply.status !== "applied")
        blockingReasons.push("Source changes have not been applied.");
    else
        passed.push("Source changes were applied through VibeCLI.");
    if (state.lifecycle?.commit?.status !== "created")
        blockingReasons.push("No VibeCLI commit has been created.");
    else
        passed.push("VibeCLI commit exists.");
    const ledger = await verifyLedger(cwd, runId).catch(() => undefined);
    if (!ledger?.ok)
        blockingReasons.push("Ledger verification failed or is missing.");
    else
        passed.push("Ledger verified.");
    if (state.verification?.status !== "passed")
        blockingReasons.push("Verification has not passed.");
    else
        passed.push("Verification passed.");
    if (state.scanners?.criticalFindings || state.scanners?.highFindings) {
        blockingReasons.push("High or critical scanner findings exist.");
    }
    else {
        passed.push("Scanner findings do not include high/critical issues.");
    }
    const exceptions = await readPolicyExceptions(cwd, runId);
    const unresolvedHighRisk = exceptions.exceptions.filter((item) => (item.severity === "high" || item.severity === "critical") && item.status !== "approved");
    if (unresolvedHighRisk.length)
        blockingReasons.push("High/critical policy exceptions are unresolved.");
    if (feedback?.summary.failedChecks) {
        blockingReasons.push("GitHub status checks include failures.");
    }
    if (feedback?.summary.pendingChecks)
        warnings.push("GitHub status checks are pending.");
    if (feedback?.summary.changeRequests || feedback?.summary.blockingComments) {
        blockingReasons.push("Reviewer feedback contains requested changes.");
    }
    if (await isDirty(cwd))
        warnings.push("Git working tree has local changes.");
    const verdict = state.lifecycle?.commit?.status !== "created"
        ? "not_ready"
        : blockingReasons.length
            ? "blocked"
            : warnings.length
                ? "ready_with_warnings"
                : "ready_to_merge";
    const result = {
        runId,
        createdAt: new Date().toISOString(),
        verdict,
        blockingReasons,
        warnings,
        passed,
        policy: state.policy ?? null,
        github: {
            prUrl: githubPr?.prUrl ?? state.lifecycle?.pr?.url ?? null,
            reviewDecision: feedback?.reviewDecision ?? null,
            failedChecks: feedback?.summary.failedChecks ?? 0,
            pendingChecks: feedback?.summary.pendingChecks ?? 0
        },
        nextActions: verdict === "ready_to_merge" || verdict === "ready_with_warnings"
            ? ["Review branch protection in GitHub before merging."]
            : [`vibe lifecycle ${runId}`, `vibe feedback ${runId}`]
    };
    await store.writeArtifact(runId, "git/merge-readiness.json", result);
    await store.writeTextArtifact(runId, "git/MERGE_READINESS.md", renderMergeReadiness(result));
    const nextState = await store.readState(runId);
    nextState.lifecycle = {
        ...nextState.lifecycle,
        branch: nextState.lifecycle?.branch ?? { proposed: null, current: null, created: false },
        commit: nextState.lifecycle?.commit ?? { status: "not_started" },
        pr: nextState.lifecycle?.pr ?? { status: "not_started" },
        feedback: nextState.lifecycle?.feedback ?? { status: "not_started" },
        mergeReadiness: { verdict: result.verdict, checkedAt: result.createdAt }
    };
    await store.writeState(nextState);
    await refreshLedgerAfterOperation(cwd, runId);
    return result;
}
export function renderMergeReadiness(result) {
    return `# Merge Readiness

Run id: ${result.runId}

Verdict: ${result.verdict}

## Blocking Reasons

${result.blockingReasons.map((reason) => `- ${reason}`).join("\n") || "- none"}

## Warnings

${result.warnings.map((warning) => `- ${warning}`).join("\n") || "- none"}

## Passed

${result.passed.map((item) => `- ${item}`).join("\n") || "- none"}

VibeCLI does not merge branches in Phase 8.
`;
}
//# sourceMappingURL=merge-readiness.js.map