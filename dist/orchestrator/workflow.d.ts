import type { VibeConfig } from "../config/schema.js";
import type { RunState } from "./state.js";
export declare function createRunId(date?: Date): string;
export declare function createInitialState(args: {
    runId: string;
    prompt: string;
    repoPath: string;
    artifactsPath: string;
}): RunState;
export declare function executePhaseOneWorkflow(args: {
    cwd: string;
    prompt: string;
    profile: string;
    config?: VibeConfig;
    policy?: string;
    maxCostUsd?: number;
    runId?: string;
}): Promise<RunState>;
export declare function executePhaseTwoLiveWorkflow(args: {
    cwd: string;
    prompt: string;
    profile: string;
    config: VibeConfig;
    runId?: string;
    stream?: boolean;
    policy?: string;
    maxCostUsd?: number;
}): Promise<RunState>;
