export type LedgerVerification = {
    runId: string;
    ok: boolean;
    checkedAt: string;
    entries: Array<{
        path: string;
        ok: boolean;
        reason: string;
    }>;
    manifestHashOk: boolean;
    status: "pass" | "pass_with_disposals" | "fail";
    disposalsAccepted: number;
};
export declare function verifyLedger(cwd: string, runId: string, options?: {
    strict?: boolean;
}): Promise<LedgerVerification>;
