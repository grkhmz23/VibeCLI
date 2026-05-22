import type { RetentionEnforcementPreview } from "./types.js";
export declare function previewRetentionEnforcement(cwd: string, runId: string, options?: {
    policy?: string;
}): Promise<RetentionEnforcementPreview>;
