import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { redactHandoffText } from "../handoff/redaction.js";
import { refreshLedgerAfterOperation } from "../ledger/events.js";
import { RunStore } from "../orchestrator/run-store.js";
import { buildReviewResponsePlan } from "./analysis.js";
export async function ingestLocalFeedback(cwd, runId, path) {
    const resolved = resolve(cwd, path);
    const root = resolve(cwd);
    if (path.startsWith("/") ||
        path.includes("..") ||
        (resolved !== root && !resolved.startsWith(`${root}/`))) {
        throw new Error("Feedback file must be inside the repo root.");
    }
    const body = redactHandoffText((await readFile(resolved, "utf8")).slice(0, 20_000));
    const feedback = {
        runId,
        createdAt: new Date().toISOString(),
        source: "local",
        pr: null,
        reviewDecision: null,
        comments: [
            {
                author: null,
                body,
                file: null,
                line: null,
                severity: body.includes("change") ? "change_requested" : "info"
            }
        ],
        checks: [],
        summary: {
            blockingComments: 0,
            changeRequests: body.includes("change") ? 1 : 0,
            failedChecks: 0,
            pendingChecks: 0
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
//# sourceMappingURL=local.js.map