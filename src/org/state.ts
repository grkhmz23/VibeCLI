import type { RunStore } from "../orchestrator/run-store.js";
import type { OrganizationState, RunState } from "../orchestrator/state.js";

export function defaultOrganizationState(enabled = false): OrganizationState {
  return {
    enabled,
    policyBundle: { status: "not_started" },
    approvals: { status: "not_started" },
    receiptRefresh: { status: "not_started" },
    retention: { status: "not_started" },
    evidenceExport: { status: "not_started" },
    audit: { status: "not_started" },
    report: { status: "not_started" }
  };
}

export async function updateOrganizationState(
  store: RunStore,
  runId: string,
  updater: (organization: OrganizationState, state: RunState) => void
): Promise<RunState> {
  const state = await store.readState(runId);
  state.organization ??= defaultOrganizationState(false);
  updater(state.organization, state);
  state.updatedAt = new Date().toISOString();
  await store.writeState(state);
  return state;
}
