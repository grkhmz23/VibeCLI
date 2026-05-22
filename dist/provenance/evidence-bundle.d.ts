import type { EvidenceManifest } from "./types.js";
export declare function createEvidenceBundle(cwd: string, runId: string, options?: {
    sign?: boolean;
    confirm?: string;
}): Promise<EvidenceManifest>;
export declare function verifyEvidenceBundle(cwd: string, runId: string): Promise<{
    runId: string;
    ok: boolean;
    checks: Array<{
        name: string;
        ok: boolean;
        message: string;
    }>;
}>;
