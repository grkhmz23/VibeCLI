import type { DisposalPlan } from "./types.js";
export declare function createDisposalPlan(cwd: string, runId: string, options?: {
    forcePreview?: boolean;
}): Promise<DisposalPlan>;
