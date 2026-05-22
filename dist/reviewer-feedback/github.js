import { redactHandoffText } from "../handoff/redaction.js";
import { runGh } from "../github/gh.js";
import { refreshLedgerAfterOperation } from "../ledger/events.js";
import { RunStore } from "../orchestrator/run-store.js";
import { buildReviewResponsePlan } from "./analysis.js";
export async function ingestGithubFeedback(cwd, runId, pr, confirm) {
    if (confirm !== `INGEST FEEDBACK ${runId}`)
        throw new Error(`GitHub feedback ingestion requires exact confirmation: INGEST FEEDBACK ${runId}`);
    const { stdout } = await runGh(["pr", "view", pr, "--json", "reviews,comments,reviewDecision,statusCheckRollup"], cwd);
    const parsed = JSON.parse(stdout || "{}");
    const comments = [
        ...(parsed.comments ?? []).map((comment) => ({
            author: comment.author?.login ?? null,
            body: redactHandoffText((comment.body ?? "").slice(0, 4000)),
            file: comment.path ?? null,
            line: comment.line ?? null,
            severity: /blocking|blocker/i.test(comment.body ?? "")
                ? "blocking"
                : /change|required|fix/i.test(comment.body ?? "")
                    ? "change_requested"
                    : "info"
        })),
        ...(parsed.reviews ?? []).map((review) => ({
            author: review.author?.login ?? null,
            body: redactHandoffText((review.body ?? review.state ?? "").slice(0, 4000)),
            file: null,
            line: null,
            severity: review.state === "CHANGES_REQUESTED" ? "change_requested" : "info"
        }))
    ];
    const checks = (parsed.statusCheckRollup ?? []).map((check) => ({
        name: check.name ?? "unknown",
        status: check.status ?? "unknown",
        conclusion: check.conclusion ?? null
    }));
    const feedback = {
        runId,
        createdAt: new Date().toISOString(),
        source: "github",
        pr,
        reviewDecision: parsed.reviewDecision ?? null,
        comments,
        checks,
        summary: {
            blockingComments: comments.filter((comment) => comment.severity === "blocking").length,
            changeRequests: comments.filter((comment) => comment.severity === "change_requested").length,
            failedChecks: checks.filter((check) => check.conclusion === "FAILURE" || check.conclusion === "TIMED_OUT").length,
            pendingChecks: checks.filter((check) => !check.conclusion || check.status === "PENDING")
                .length
        },
        nextActions: [`vibe repair ${runId} --plan`]
    };
    const store = new RunStore(cwd);
    await store.writeArtifact(runId, "reviewer-feedback.json", feedback);
    await store.writeTextArtifact(runId, "REVIEW_RESPONSE_PLAN.md", buildReviewResponsePlan(feedback));
    const state = await store.readState(runId);
    state.lifecycle = {
        ...state.lifecycle,
        branch: state.lifecycle?.branch ?? { proposed: null, current: null, created: false },
        commit: state.lifecycle?.commit ?? { status: "not_started" },
        pr: state.lifecycle?.pr ?? { status: "not_started" },
        feedback: { status: "ingested", ingestedAt: feedback.createdAt },
        mergeReadiness: state.lifecycle?.mergeReadiness ?? { verdict: "not_started" }
    };
    await store.writeState(state);
    await refreshLedgerAfterOperation(cwd, runId);
    return feedback;
}
//# sourceMappingURL=github.js.map