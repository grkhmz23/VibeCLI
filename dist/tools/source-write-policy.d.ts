export type SourceWritePolicyOptions = {
    repoRoot: string;
    allowLockfiles?: boolean;
};
export declare function normalizeRepoPath(path: string): string;
export declare function validateSourcePath(path: string, options: SourceWritePolicyOptions): string;
export declare function validatePatchContent(content: string): void;
export declare function isProtectedPath(path: string): boolean;
