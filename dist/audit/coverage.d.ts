import type { AuditCoverageReport } from "./types.js";
export declare function generateAuditCoverage(cwd: string, runId: string, options?: {
    schema?: string;
}): Promise<AuditCoverageReport>;
