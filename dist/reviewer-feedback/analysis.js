export function buildReviewResponsePlan(feedback) {
    return `# Review Response Plan

Run id: ${feedback.runId}

Review decision: ${feedback.reviewDecision ?? "unknown"}

Blocking comments: ${feedback.summary.blockingComments}

Failed checks: ${feedback.summary.failedChecks}

## Next Actions

${feedback.nextActions.map((action) => `- ${action}`).join("\n")}
`;
}
//# sourceMappingURL=analysis.js.map