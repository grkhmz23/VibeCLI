import type { LegalHoldRecord } from "./types.js";
export declare function legalHoldStatus(cwd: string, runId: string): Promise<LegalHoldRecord | {
    runId: string;
    status: "not_started";
}>;
export declare function enableLegalHold(cwd: string, runId: string, options: {
    reason?: string;
    by?: string;
    confirm?: string;
}): Promise<LegalHoldRecord>;
export declare function releaseLegalHold(cwd: string, runId: string, options: {
    reason?: string;
    by?: string;
    confirm?: string;
}): Promise<LegalHoldRecord>;
