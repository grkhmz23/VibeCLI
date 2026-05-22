export type DeploymentReadiness = {
    runId: string;
    createdAt: string;
    verdict: "ready_to_deploy" | "ready_with_warnings" | "blocked" | "not_ready";
    blockingReasons: string[];
    warnings: string[];
    passed: string[];
    manualChecks: string[];
    nextActions: string[];
};
export declare function evaluateDeploymentReadiness(cwd: string, runId: string, options?: {
    channel?: string;
}): Promise<DeploymentReadiness>;
export declare function renderDeploymentReadiness(value: DeploymentReadiness): string;
