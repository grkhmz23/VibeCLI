export type MergeReadinessResult = {
    runId: string;
    createdAt: string;
    verdict: "ready_to_merge" | "ready_with_warnings" | "blocked" | "not_ready";
    blockingReasons: string[];
    warnings: string[];
    passed: string[];
    policy: string | null;
    github: {
        prUrl: string | null;
        reviewDecision: string | null;
        failedChecks: number;
        pendingChecks: number;
    };
    nextActions: string[];
};
export declare function evaluateMergeReadiness(cwd: string, runId: string, options?: {
    github?: boolean;
    pr?: string;
    confirm?: string;
}): Promise<MergeReadinessResult>;
export declare function renderMergeReadiness(result: MergeReadinessResult): string;
