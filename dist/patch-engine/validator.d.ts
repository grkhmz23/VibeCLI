import type { PatchValidationEntry } from "./types.js";
export declare function validateUnifiedDiff(args: {
    repoRoot: string;
    diff: string;
    allowLockfiles?: boolean;
}): Promise<PatchValidationEntry[]>;
