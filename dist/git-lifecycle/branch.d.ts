import type { BranchResult } from "./types.js";
export declare function proposedBranchName(cwd: string, runId: string, custom?: string): Promise<string>;
export declare function branchRun(cwd: string, runId: string, options?: {
    name?: string;
    create?: boolean;
    confirm?: string;
    allowDirty?: boolean;
    switchExisting?: boolean;
}): Promise<BranchResult>;
