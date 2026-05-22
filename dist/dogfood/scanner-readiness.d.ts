export type ScannerReadinessReport = {
    createdAt: string;
    scanners: Array<{
        name: string;
        available: boolean;
        version: string | null;
        status: "available" | "missing" | "failed";
        notes: string[];
    }>;
    summary: {
        available: number;
        missing: number;
        failed: number;
    };
    nextActions: string[];
};
export declare function scannerReadiness(cwd: string, options?: {
    runSafe?: boolean;
    confirm?: string;
    strict?: boolean;
    installGuide?: boolean;
}): Promise<ScannerReadinessReport>;
