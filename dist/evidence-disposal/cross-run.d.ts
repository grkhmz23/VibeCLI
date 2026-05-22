type DisposalReportRun = {
    runId: string;
    eligible: boolean;
    legalHold: boolean;
    retentionExpired: boolean;
    archiveVerified: boolean;
    approvalStatus: string;
    candidateFiles: number;
    candidateBytes: number;
    disposalStatus: "not_started" | "planned" | "prechecked" | "completed" | "partial" | "failed" | "blocked";
    blockingReasons: string[];
};
export declare function createDisposalReport(cwd: string, options?: {
    deep?: boolean;
}): Promise<{
    createdAt: string;
    runs: DisposalReportRun[];
    summary: {
        totalRuns: number;
        eligibleRuns: number;
        blockedByLegalHold: number;
        blockedByRetention: number;
        blockedByArchive: number;
        completedDisposals: number;
        candidateBytes: number;
    };
    nextActions: string[];
    warnings: string[];
}>;
export {};
