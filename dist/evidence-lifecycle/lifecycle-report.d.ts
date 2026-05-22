import type { EvidenceLifecycleReport } from "./types.js";
export declare function createEvidenceLifecycleReport(cwd: string, runId: string): Promise<EvidenceLifecycleReport>;
export declare function createEvidenceLifecycleIndex(cwd: string): Promise<{
    createdAt: string;
    runs: Array<{
        runId: string;
        inventory: string;
        archive: string;
        legalHold: string;
        retentionLedger: string;
        compaction: string;
    }>;
}>;
