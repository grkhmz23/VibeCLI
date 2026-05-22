export type PerfCheckReport = {
    createdAt: string;
    checks: Array<{
        name: string;
        durationMs: number;
        status: "passed" | "warning" | "failed";
        thresholdMs: number | null;
        message: string;
    }>;
    artifactSizes: Array<{
        path: string;
        sizeBytes: number;
        warning: boolean;
    }>;
    summary: {
        warnings: number;
        failures: number;
    };
};
export declare function runPerfCheck(cwd: string): Promise<PerfCheckReport>;
