import type { EvidenceLifecycleState, RunState } from "../orchestrator/state.js";
import type { RunStore } from "../orchestrator/run-store.js";
export declare function defaultEvidenceLifecycleState(): EvidenceLifecycleState;
export declare function ensureEvidenceLifecycleState(state: RunState): EvidenceLifecycleState;
export declare function updateEvidenceLifecycleState(store: RunStore, runId: string, updater: (evidenceLifecycle: EvidenceLifecycleState, state: RunState) => void): Promise<RunState>;
