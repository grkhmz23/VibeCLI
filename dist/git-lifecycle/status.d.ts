export declare function currentBranch(cwd: string): Promise<string | null>;
export declare function isDirty(cwd: string): Promise<boolean>;
export declare function branchExists(cwd: string, branch: string): Promise<boolean>;
export declare function gitHead(cwd: string): Promise<string | null>;
export declare function remoteOrigin(cwd: string): Promise<string | null>;
