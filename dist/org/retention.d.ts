import type { RetentionPlan } from "./types.js";
export declare function createRetentionPlan(cwd: string, runId: string, options?: {
    policy?: string;
    mark?: boolean;
    confirm?: string;
    purgePreview?: boolean;
}): Promise<RetentionPlan>;
export declare function readRetentionPlan(cwd: string, runId: string): Promise<RetentionPlan | null>;
