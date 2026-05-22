import type { AuditorHandoff } from "./types.js";
export declare function createAuditorHandoff(cwd: string, runId: string, options?: {
    schema?: string;
    minimal?: boolean;
}): Promise<AuditorHandoff>;
export declare function verifyAuditorHandoff(cwd: string, runId: string): Promise<{
    ok: boolean;
    checks: Array<{
        name: string;
        ok: boolean;
        message: string;
    }>;
}>;
