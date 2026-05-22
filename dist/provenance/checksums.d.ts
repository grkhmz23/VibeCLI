import type { ChecksumManifest } from "./types.js";
export declare const safeChecksumPaths: string[];
export declare function createChecksums(cwd: string, runId: string): Promise<ChecksumManifest>;
export declare function verifyChecksums(cwd: string, runId: string): Promise<{
    runId: string;
    ok: boolean;
    checks: Array<{
        path: string;
        ok: boolean;
        message: string;
    }>;
}>;
