import type { ChangelogEntry } from "./types.js";
export declare function generateChangelogEntry(cwd: string, runId: string): Promise<ChangelogEntry>;
export declare function renderChangelogEntry(entry: ChangelogEntry): string;
export declare function writeChangelog(cwd: string, runId: string, options: {
    confirm?: string;
}): Promise<{
    runId: string;
    path: string;
    status: "written";
    rollbackPath: string;
}>;
