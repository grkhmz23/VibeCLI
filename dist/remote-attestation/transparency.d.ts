import type { TransparencyChainEntry, TransparencyEntry } from "./types.js";
export declare function generateTransparencyEntry(cwd: string, runId: string): Promise<TransparencyEntry>;
export declare function appendTransparencyEntry(cwd: string, runId: string, confirm?: string): Promise<TransparencyChainEntry>;
export declare function verifyTransparencyLog(cwd: string, runId?: string): Promise<{
    ok: boolean;
    checks: Array<{
        index: number;
        ok: boolean;
        message: string;
    }>;
    foundRun: boolean;
}>;
