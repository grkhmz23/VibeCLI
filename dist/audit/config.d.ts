import type { AuditConfig } from "./types.js";
export declare const defaultAuditConfig: AuditConfig;
export declare function loadAuditConfig(cwd: string): Promise<AuditConfig>;
export declare function auditPaths(cwd: string): Promise<{
    schemaDir: string;
    exportDir: string;
    reviewerDirectoryDir: string;
}>;
