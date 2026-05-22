type BetaCheck = {
    name: string;
    category: "build" | "tests" | "package" | "docs" | "security" | "dogfood" | "providers" | "scanners" | "ux" | "performance";
    status: "passed" | "warning" | "failed" | "not_run";
    blocking: boolean;
    message: string;
    evidencePath: string | null;
};
export type BetaReadinessReport = {
    createdAt: string;
    verdict: "beta_ready" | "ready_with_warnings" | "blocked";
    checks: BetaCheck[];
    blockers: string[];
    warnings: string[];
    nextActions: string[];
};
export declare function runBetaCheck(cwd: string, options?: {
    strict?: boolean;
}): Promise<BetaReadinessReport>;
export {};
