import type { AuditReport } from "./types.js";
export declare function createAuditExport(cwd: string, runId: string, options?: {
    schema?: string;
    sign?: boolean;
    confirm?: string;
    format?: "json" | "markdown" | "csv";
}): Promise<AuditReport>;
export declare function verifyAuditExport(cwd: string, runId: string): Promise<{
    ok: boolean;
    checks: Array<{
        name: string;
        ok: boolean;
        message: string;
    }>;
}>;
