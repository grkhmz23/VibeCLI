import type { ProvenanceState, RunState } from "../orchestrator/state.js";
import type { RunStore } from "../orchestrator/run-store.js";
export declare function defaultProvenanceState(): ProvenanceState;
export declare function ensureProvenanceState(state: RunState): ProvenanceState;
export declare function updateProvenanceState(store: RunStore, runId: string, update: (provenance: ProvenanceState, state: RunState) => void): Promise<RunState>;
