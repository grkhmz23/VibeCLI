export type ReleaseBranchResult = {
    runId: string;
    createdAt: string;
    mode: "preview" | "created" | "failed";
    branch: string;
    previousBranch: string | null;
    currentBranch: string | null;
    targetChannel: string;
    warnings: string[];
    errors: string[];
};
export declare function releaseBranchRun(cwd: string, runId: string, options?: {
    create?: boolean;
    confirm?: string;
    allowDirty?: boolean;
    channel?: string;
    allowBlocked?: boolean;
}): Promise<ReleaseBranchResult>;
