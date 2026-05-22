export type ShellResult = {
    command: string;
    status: "success" | "failed" | "skipped";
    exitCode: number | null;
    stdout: string;
    stderr: string;
    reason: string;
};
export declare function redactSecrets(output: string): string;
export declare function executeAllowedCommand(command: string, cwd: string): Promise<string>;
export declare function executeAllowedCommandDetailed(command: string, cwd: string, timeoutMs?: number): Promise<ShellResult>;
