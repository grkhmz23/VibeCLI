import type { AuditState, RunState } from "../orchestrator/state.js";
import type { RunStore } from "../orchestrator/run-store.js";
export declare function defaultAuditState(): AuditState;
export declare function ensureAuditState(state: RunState): AuditState;
export declare function updateAuditState(store: RunStore, runId: string, updater: (audit: AuditState, state: RunState) => void): Promise<RunState>;
