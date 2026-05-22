import type { AuditConfig, AuditControlCategory, AuditControlSeverity, AuditSchema } from "./types.js";
export declare const auditCategories: AuditControlCategory[];
export declare const auditSeverities: AuditControlSeverity[];
export declare function validateAuditConfig(config: AuditConfig): string[];
export declare function validateAuditSchema(schema: AuditSchema): string[];
