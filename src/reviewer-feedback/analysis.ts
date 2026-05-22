import type { ReviewerFeedback } from "./types.js";

export function buildReviewResponsePlan(feedback: ReviewerFeedback): string {
  return `# Review Response Plan

Run id: ${feedback.runId}

Review decision: ${feedback.reviewDecision ?? "unknown"}

Blocking comments: ${feedback.summary.blockingComments}

Failed checks: ${feedback.summary.failedChecks}

## Next Actions

${feedback.nextActions.map((action) => `- ${action}`).join("\n")}
`;
}
