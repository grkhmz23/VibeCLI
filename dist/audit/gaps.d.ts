import type { AuditGapsReport } from "./types.js";
export declare function generateAuditGaps(cwd: string, runId: string, options?: {
    schema?: string;
}): Promise<AuditGapsReport>;
