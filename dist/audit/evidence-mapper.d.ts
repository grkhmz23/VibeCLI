import type { AuditEvidenceMap } from "./types.js";
export declare function generateAuditEvidenceMap(cwd: string, runId: string, options?: {
    schema?: string;
}): Promise<AuditEvidenceMap>;
