import type { RunStore } from "../orchestrator/run-store.js";
import type { OrganizationState, RunState } from "../orchestrator/state.js";
export declare function defaultOrganizationState(enabled?: boolean): OrganizationState;
export declare function updateOrganizationState(store: RunStore, runId: string, updater: (organization: OrganizationState, state: RunState) => void): Promise<RunState>;
