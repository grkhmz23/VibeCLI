import { RunStore } from "./run-store.js";
import type { PatchManifest } from "./patches.js";
export type ReviewSummary = {
    runId: string;
    runStatus: string;
    approvalStatus: string;
    patchCount: number;
    filesAffected: Array<{
        path: string;
        operation: string;
        blocked: boolean;
        reason?: string;
    }>;
    commands: unknown[];
    securityVerdict: string;
};
export declare function readPatchManifest(store: RunStore, runId: string): Promise<PatchManifest>;
export declare function readPatchDiffs(store: RunStore, runId: string): Promise<string>;
export declare function reviewRun(cwd: string, runId: string): Promise<ReviewSummary>;
export declare function formatReview(summary: ReviewSummary, concise?: boolean): string;
export declare function diffStat(cwd: string, runId: string): Promise<Array<{
    path: string;
    added: number;
    removed: number;
}>>;
export declare function checkRunDiffs(cwd: string, runId: string): Promise<{
    runId: string;
    createdAt: string;
    ok: boolean;
    patches: Array<{
        path: string;
        ok: boolean;
        operation: string;
        additions: number;
        deletions: number;
        hunks: number;
        errors: string[];
    }>;
}>;
