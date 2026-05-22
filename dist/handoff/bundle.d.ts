import type { HandoffManifest, HandoffSummary } from "./types.js";
export declare function buildHandoffSummary(cwd: string, runId: string): Promise<HandoffSummary>;
export declare function writeHandoffManifest(cwd: string, runId: string): Promise<HandoffManifest>;
export declare function createHandoffBundle(cwd: string, runId: string): Promise<HandoffSummary>;
export declare function verifyHandoffBundle(cwd: string, runId: string): Promise<{
    runId: string;
    ok: boolean;
    ledgerStatus: "pass" | "fail" | "missing";
    files: Array<{
        path: string;
        ok: boolean;
        reason: string;
    }>;
}>;
export declare function archiveHandoffBundle(cwd: string, runId: string): Promise<{
    path: string;
    sha256: string;
}>;
