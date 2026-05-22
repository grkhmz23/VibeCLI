import type { ReleaseManifest } from "./types.js";
export declare function writeReleaseManifest(cwd: string, runId: string): Promise<ReleaseManifest>;
export declare function verifyReleaseIntegrity(cwd: string, runId: string): Promise<{
    runId: string;
    ok: boolean;
    ledgerStatus: "pass" | "fail" | "missing";
    files: Array<{
        path: string;
        ok: boolean;
        reason: string;
    }>;
}>;
