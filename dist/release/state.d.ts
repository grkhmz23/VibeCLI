import type { ReleaseState, RunState } from "../orchestrator/state.js";
import type { RunStore } from "../orchestrator/run-store.js";
export declare function defaultReleaseState(): ReleaseState;
export declare function ensureReleaseState(state: RunState): ReleaseState;
export declare function updateReleaseState(store: RunStore, runId: string, update: (release: ReleaseState, state: RunState) => void): Promise<RunState>;
