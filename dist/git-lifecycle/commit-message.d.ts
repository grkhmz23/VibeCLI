import type { CommitMessageResult } from "./types.js";
export declare function generateCommitMessage(cwd: string, runId: string, styleOverride?: "conventional" | "plain"): Promise<CommitMessageResult>;
