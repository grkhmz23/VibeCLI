export type SecurityRedteamReport = {
    createdAt: string;
    checks: Array<{
        name: string;
        status: "passed" | "failed" | "skipped";
        severity: "low" | "medium" | "high" | "critical";
        message: string;
    }>;
    summary: {
        passed: number;
        failed: number;
        skipped: number;
        criticalFailed: number;
        highFailed: number;
    };
    blockers: string[];
    nextActions: string[];
};
export declare function runSecurityRedteam(cwd: string): Promise<SecurityRedteamReport>;
