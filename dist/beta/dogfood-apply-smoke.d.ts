type Step = {
    name: string;
    status: "passed" | "failed" | "skipped";
    message: string;
    durationMs: number;
};
export type DogfoodApplySmokeReport = {
    createdAt: string;
    fixture: "node-package";
    status: "passed" | "failed";
    fixturePath: string;
    steps: Step[];
    checks: {
        patchReviewed: boolean;
        diffChecked: boolean;
        approved: boolean;
        applied: boolean;
        verificationRan: boolean;
        rollbackRan: boolean;
        ledgerVerified: boolean;
        sourceRestored: boolean;
    };
    warnings: string[];
    errors: string[];
};
export declare function runDogfoodApplySmoke(cwd: string): Promise<DogfoodApplySmokeReport>;
export {};
