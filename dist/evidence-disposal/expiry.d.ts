import type { DisposalEligibility } from "./types.js";
export declare function evaluateDisposalEligibility(cwd: string, runId: string, options?: {
    policy?: string;
}): Promise<DisposalEligibility>;
