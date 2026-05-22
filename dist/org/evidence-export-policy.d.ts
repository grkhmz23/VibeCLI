import type { EvidenceExportManifest } from "./types.js";
export declare function createEvidenceExport(cwd: string, runId: string, options?: {
    mode?: "minimal" | "audit" | "forensic_redacted" | "forensic-redacted";
}): Promise<EvidenceExportManifest>;
export declare function verifyEvidenceExport(cwd: string, runId: string): Promise<{
    ok: boolean;
    checks: Array<{
        name: string;
        ok: boolean;
        message: string;
    }>;
}>;
