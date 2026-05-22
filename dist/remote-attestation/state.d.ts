import type { RemoteAttestationState, RunState } from "../orchestrator/state.js";
import type { RunStore } from "../orchestrator/run-store.js";
export declare function defaultRemoteAttestationState(): RemoteAttestationState;
export declare function ensureRemoteAttestationState(state: RunState): RemoteAttestationState;
export declare function updateRemoteAttestationState(store: RunStore, runId: string, update: (remoteAttestation: RemoteAttestationState, state: RunState) => void): Promise<RunState>;
