export type ReadinessResult = {
    runId: string;
    verdict: "ready_for_pr" | "ready_with_warnings" | "blocked" | "not_applied";
    blockingReasons: string[];
    warnings: string[];
    passed: string[];
    nextActions: string[];
};
export declare function evaluateReadiness(cwd: string, runId: string): Promise<ReadinessResult>;
