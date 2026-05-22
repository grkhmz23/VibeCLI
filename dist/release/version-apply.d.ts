export type VersionApplyResult = {
    runId: string;
    status: "applied" | "failed";
    filesChanged: string[];
    rollbackPath: string;
    errors: string[];
};
export declare function applyVersionPlan(cwd: string, runId: string, options: {
    confirm?: string;
}): Promise<VersionApplyResult>;
