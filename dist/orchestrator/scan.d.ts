import type { ScannerResult } from "../scanners/types.js";
export type ExternalScannerResults = {
    runId: string;
    startedAt: string;
    finishedAt: string;
    status: "pass" | "fail" | "warning" | "skipped";
    scanners: Array<{
        scanner: string;
        available: boolean;
        status: "pass" | "fail" | "warning" | "skipped";
        exitCode: number | null;
        durationMs: number;
        findings: Array<{
            severity: "low" | "medium" | "high" | "critical" | "unknown";
            file: string | null;
            message: string;
            recommendation: string;
        }>;
        summary: string;
    }>;
};
export declare function scanRunBuiltin(cwd: string, runId: string): Promise<ScannerResult[]>;
export declare function scanRunExternal(cwd: string, runId: string, confirm?: string): Promise<ExternalScannerResults>;
