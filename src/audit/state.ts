import type { AuditState, RunState } from "../orchestrator/state.js";
import type { RunStore } from "../orchestrator/run-store.js";

export function defaultAuditState(): AuditState {
  return {
    schema: { status: "not_started" },
    map: { status: "not_started" },
    coverage: { status: "not_started" },
    gaps: { status: "not_started" },
    export: { status: "not_started" },
    complianceBundle: { status: "not_started" },
    reviewerDirectory: { status: "not_started" },
    auditorHandoff: { status: "not_started" }
  };
}

export function ensureAuditState(state: RunState): AuditState {
  const base = defaultAuditState();
  state.audit = {
    ...base,
    ...state.audit,
    schema: { ...base.schema, ...state.audit?.schema },
    map: { ...base.map, ...state.audit?.map },
    coverage: { ...base.coverage, ...state.audit?.coverage },
    gaps: { ...base.gaps, ...state.audit?.gaps },
    export: { ...base.export, ...state.audit?.export },
    complianceBundle: { ...base.complianceBundle, ...state.audit?.complianceBundle },
    reviewerDirectory: { ...base.reviewerDirectory, ...state.audit?.reviewerDirectory },
    auditorHandoff: { ...base.auditorHandoff, ...state.audit?.auditorHandoff }
  };
  return state.audit;
}

export async function updateAuditState(
  store: RunStore,
  runId: string,
  updater: (audit: AuditState, state: RunState) => void
): Promise<RunState> {
  const state = await store.readState(runId);
  const audit = ensureAuditState(state);
  updater(audit, state);
  state.updatedAt = new Date().toISOString();
  await store.writeState(state);
  return state;
}
