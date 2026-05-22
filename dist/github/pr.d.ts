import type { GitHubPrResult } from "./types.js";
export declare function githubPr(cwd: string, runId: string, options?: {
    create?: boolean;
    push?: boolean;
    confirm?: string;
    allowLedgerWarning?: boolean;
    allowRisk?: boolean;
    allowUnverified?: boolean;
    allowMainBranch?: boolean;
    allowDirty?: boolean;
}): Promise<GitHubPrResult>;
