import type { RunEvent, RunState } from "./state.js";
export declare class RunStore {
    private readonly cwd;
    constructor(cwd: string);
    runPath(runId: string): string;
    createRunDirectory(runId: string): Promise<string>;
    writeInput(runId: string, input: object): Promise<void>;
    writeState(state: RunState): Promise<void>;
    readState(runId: string): Promise<RunState>;
    appendEvent(runId: string, event: RunEvent): Promise<void>;
    writeArtifact(runId: string, relativePath: string, value: unknown): Promise<void>;
    writeTextArtifact(runId: string, relativePath: string, value: string): Promise<void>;
    writeSecurityBaseline(runId: string): Promise<void>;
    latestRunId(): Promise<string | undefined>;
}
