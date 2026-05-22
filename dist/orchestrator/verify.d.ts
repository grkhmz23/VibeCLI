type VerifyName = "typecheck" | "lint" | "test" | "build";
export type VerificationResults = {
    runId: string;
    startedAt: string;
    finishedAt: string;
    status: "passed" | "failed" | "skipped";
    commands: Array<{
        name: VerifyName;
        command: string;
        status: "passed" | "failed" | "skipped";
        exitCode: number | null;
        durationMs: number;
        stdout: string;
        stderr: string;
        reason: string | null;
    }>;
};
export declare function verifyRun(cwd: string, runId: string, options: {
    confirm?: string;
    names?: VerifyName[];
    timeoutMs?: number;
}): Promise<VerificationResults>;
export {};
