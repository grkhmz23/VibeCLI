export declare function verifyRetentionLedger(cwd: string, runId?: string): Promise<{
    ok: boolean;
    eventCount: number;
    latestChainHash: string | null;
    errors: string[];
}>;
