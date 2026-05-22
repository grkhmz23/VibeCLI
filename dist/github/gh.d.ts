export declare function runGh(args: string[], cwd: string): Promise<{
    stdout: string;
    stderr: string;
}>;
export declare function githubDoctor(cwd: string): Promise<{
    ghInstalled: boolean;
    authenticated: boolean;
    remote: string | null;
    branch: string | null;
    messages: string[];
}>;
