export type ApplyResult = {
    runId: string;
    status: "applied" | "partially_applied" | "failed" | "dry_run_passed" | "dry_run_failed";
    startedAt: string;
    finishedAt: string;
    filesChanged: string[];
    filesCreated: string[];
    filesModified: string[];
    filesDeleted: string[];
    blockedPatches: Array<{
        path: string;
        reason: string;
    }>;
    errors: string[];
};
export type VerificationResult = {
    runId: string;
    ok: boolean;
    checks: Array<{
        name: string;
        ok: boolean;
        message: string;
    }>;
};
export type PreApplyMetadata = {
    runId: string;
    createdAt: string;
    repoRoot: string;
    gitBranch: string | null;
    gitHead: string | null;
    filesBackedUp: Array<{
        path: string;
        existed: boolean;
        backupPath: string | null;
        sha256: string | null;
    }>;
};
export declare function applyRun(cwd: string, runId: string, options: {
    confirm?: string;
    dryRun?: boolean;
    allowLockfiles?: boolean;
}): Promise<ApplyResult>;
