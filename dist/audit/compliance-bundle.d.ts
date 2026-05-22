import type { ComplianceCheckBundle } from "./types.js";
export declare function createComplianceBundle(cwd: string, runId: string, options?: {
    schema?: string;
    minimal?: boolean;
    sign?: boolean;
    confirm?: string;
}): Promise<ComplianceCheckBundle>;
export declare function verifyComplianceBundle(cwd: string, runId: string): Promise<{
    ok: boolean;
    checks: Array<{
        name: string;
        ok: boolean;
        message: string;
    }>;
}>;
