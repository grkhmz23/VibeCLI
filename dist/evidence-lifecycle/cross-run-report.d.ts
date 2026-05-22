export type EvidenceCrossRunReport = {
    createdAt: string;
    runs: Array<{
        runId: string;
        createdAt: string | null;
        status: string | null;
        retentionPolicy: string | null;
        legalHold: boolean;
        archiveStatus: string;
        compactionStatus: string;
        ledgerStatus: string;
        totalEvidenceBytes: number | null;
        warnings: string[];
    }>;
    summary: {
        totalRuns: number;
        archivedRuns: number;
        legalHoldRuns: number;
        missingInventory: number;
        missingRetentionPlan: number;
        missingArchive: number;
        ledgerInvalid: number;
    };
    nextActions: string[];
};
export declare function createEvidenceReport(cwd: string, options?: {
    deep?: boolean;
    policy?: string;
}): Promise<EvidenceCrossRunReport>;
