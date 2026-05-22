export type LedgerEntry = {
    path: string;
    sha256: string;
    sizeBytes: number;
    updatedAt: string;
};
export type LedgerManifest = {
    runId: string;
    createdAt: string;
    updatedAt: string;
    algorithm: "sha256";
    entries: LedgerEntry[];
    eventLogHash: string | null;
    manifestHash: string;
};
export declare function writeLedgerManifest(cwd: string, runId: string): Promise<LedgerManifest>;
export declare function readLedgerManifest(cwd: string, runId: string): Promise<LedgerManifest>;
