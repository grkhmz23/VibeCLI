import { type ShellResult } from "../tools/shell.js";
export type CommandExecutionResult = {
    runId: string;
    executedAt: string;
    commands: ShellResult[];
};
export declare function readCommandReview(cwd: string, runId: string): Promise<{
    recommended: Array<{
        command: string;
        classification: string;
        reason: string;
    }>;
}>;
export declare function executeApprovedCommands(cwd: string, runId: string, options: {
    confirm?: string;
    timeoutMs?: number;
}): Promise<CommandExecutionResult>;
