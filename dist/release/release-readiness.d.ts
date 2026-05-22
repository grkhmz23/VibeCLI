export type ReleaseReadiness = {
    runId: string;
    createdAt: string;
    channel: string;
    verdict: "ready_to_release" | "ready_with_warnings" | "blocked" | "not_ready";
    blockingReasons: string[];
    warnings: string[];
    passed: string[];
    requiredApprovals: string[];
    orgApproval?: {
        status: "not_required" | "not_started" | "met" | "not_met" | "blocked";
        approvalPolicy: string | null;
        approvedCount: number;
        missingRoles: string[];
        blockingReasons: string[];
    };
    nextActions: string[];
};
export declare function evaluateReleaseReadiness(cwd: string, runId: string, options?: {
    channel?: string;
}): Promise<ReleaseReadiness>;
export declare function renderReleaseReadiness(value: ReleaseReadiness): string;
