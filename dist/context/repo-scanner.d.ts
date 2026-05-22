export type PackageManager = "pnpm" | "npm" | "yarn" | "bun" | "unknown";
export type RepoContext = {
    repoRoot: string;
    gitStatus: string;
    packageManager: PackageManager;
    packageScripts: Record<string, string>;
    dependencySummary: {
        dependencies: string[];
        devDependencies: string[];
    };
    detectedFrameworks: string[];
    importantConfigFiles: string[];
    testFilesCount: number;
    sourceFilesCount: number;
    hasEnvExample: boolean;
    hasGitignore: boolean;
    hasReadme: boolean;
    hasSecurityMd: boolean;
};
export declare function scanRepoContext(root: string): Promise<RepoContext>;
