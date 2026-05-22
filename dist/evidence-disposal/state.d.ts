import type { EvidenceDisposalState, RunState } from "../orchestrator/state.js";
import type { RunStore } from "../orchestrator/run-store.js";
export declare function defaultEvidenceDisposalState(): EvidenceDisposalState;
export declare function ensureEvidenceDisposalState(state: RunState): EvidenceDisposalState;
export declare function updateEvidenceDisposalState(store: RunStore, runId: string, updater: (disposal: EvidenceDisposalState, state: RunState) => void): Promise<RunState>;
