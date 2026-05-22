export type PackageCheckReport = {
    createdAt: string;
    checks: Array<{
        name: string;
        status: "passed" | "warning" | "failed" | "skipped";
        message: string;
    }>;
    summary: {
        passed: number;
        warnings: number;
        failed: number;
        skipped: number;
    };
    blockers: string[];
    warnings: string[];
};
export declare function runPackageCheck(cwd: string): Promise<PackageCheckReport>;
