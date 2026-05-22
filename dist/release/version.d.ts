import type { VersionBump, VersionPlan } from "./types.js";
export declare function isSemver(value: string): boolean;
export declare function planVersion(cwd: string, runId: string, options?: {
    bump?: VersionBump;
    version?: string;
    preid?: string;
    allowDowngrade?: boolean;
    confirmMajor?: string;
}): Promise<VersionPlan>;
export declare function renderVersionPlan(plan: VersionPlan): string;
