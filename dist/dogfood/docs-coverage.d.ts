export type DocsCheckReport = {
    createdAt: string;
    checks: Array<{
        name: string;
        status: "passed" | "warning" | "failed";
        message: string;
    }>;
    missingCommands: string[];
    missingConfirmations: string[];
    blockers: string[];
    warnings: string[];
};
export declare function runDocsCheck(cwd: string, options?: {
    strict?: boolean;
}): Promise<DocsCheckReport>;
