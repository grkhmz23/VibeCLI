import type { ReviewerFeedback } from "./types.js";
export declare function ingestGithubFeedback(cwd: string, runId: string, pr: string, confirm?: string): Promise<ReviewerFeedback>;
