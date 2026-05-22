import type { GitHubPrResult } from "./types.js";
export declare function updateGithubPr(cwd: string, runId: string, options: {
    pr: string;
    mode: "update" | "comment" | "sync";
    confirm?: string;
    allowLedgerWarning?: boolean;
    allowRisk?: boolean;
    allowUnverified?: boolean;
}): Promise<GitHubPrResult>;
