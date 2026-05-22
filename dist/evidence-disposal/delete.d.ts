import type { DisposalReceipt } from "./types.js";
export declare function dryRunDisposal(cwd: string, runId: string): Promise<{
    runId: string;
    ok: boolean;
    candidates: number;
}>;
export declare function executeDisposal(cwd: string, runId: string, options: {
    confirm?: string;
}): Promise<DisposalReceipt>;
