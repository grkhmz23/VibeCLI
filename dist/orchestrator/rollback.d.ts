export type RollbackResult = {
    runId: string;
    status: "rolled_back" | "dry_run_passed" | "failed";
    startedAt: string;
    finishedAt: string;
    filesRestored: string[];
    filesDeleted: string[];
    errors: string[];
};
export declare function rollbackRun(cwd: string, runId: string, options: {
    confirm?: string;
    dryRun?: boolean;
}): Promise<RollbackResult>;
