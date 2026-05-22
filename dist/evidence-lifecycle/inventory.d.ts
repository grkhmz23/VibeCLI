import type { EvidenceInventory } from "./types.js";
export declare function generateEvidenceInventory(cwd: string, runId: string, options?: {
    deep?: boolean;
}): Promise<EvidenceInventory>;
export declare function summarizeAllInventories(cwd: string): Promise<{
    runs: Array<{
        runId: string;
        status: "generated" | "missing";
        totalFiles: number | null;
    }>;
}>;
