import type { ReviewerFeedback } from "./types.js";
export declare function ingestLocalFeedback(cwd: string, runId: string, path: string): Promise<ReviewerFeedback>;
