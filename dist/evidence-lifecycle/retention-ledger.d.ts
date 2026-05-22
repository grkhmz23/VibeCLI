import type { RetentionChainEntry, RetentionLedgerEvent } from "./types.js";
export declare function appendRetentionLedgerEvent(cwd: string, event: Omit<RetentionLedgerEvent, "version" | "createdAt" | "signature">): Promise<RetentionChainEntry>;
export declare function readRetentionLedger(cwd: string): Promise<{
    events: RetentionLedgerEvent[];
    chain: RetentionChainEntry[];
}>;
export declare function retentionLedgerSummary(cwd: string, runId?: string): Promise<{
    eventCount: number;
    latestChainHash: string | null;
    events: RetentionLedgerEvent[];
}>;
export declare function recordManualRetentionEvent(cwd: string, runId: string, options: {
    event: RetentionLedgerEvent["eventType"];
    summary: string;
    confirm?: string;
}): Promise<RetentionChainEntry>;
