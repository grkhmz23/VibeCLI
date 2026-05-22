import { type Theme } from "./theme.js";
import { type ConsoleCommand } from "./shortcuts.js";
type ConsoleMode = "dry-run" | "live";
type ConsoleContext = {
    cwd: string;
    mode: ConsoleMode;
    stream: boolean;
    policy?: string;
    theme: Theme;
};
export declare function isConsoleAbortError(error: unknown): boolean;
export declare function watchRunSnapshots(context: ConsoleContext, runId?: string, options?: {
    iterations?: number;
    intervalMs?: number;
}): Promise<string[]>;
export declare function executeConsoleCommand(command: ConsoleCommand, context: ConsoleContext): Promise<string>;
export declare function runConsole(cwd?: string, options?: {
    inputLines?: string[];
}): Promise<void>;
export {};
