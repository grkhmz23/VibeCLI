import type { AuditEvidenceRef, AuditEvidenceSourceName } from "./types.js";
export declare function collectAuditEvidence(cwd: string, runId: string, source: AuditEvidenceSourceName): Promise<AuditEvidenceRef[]>;
