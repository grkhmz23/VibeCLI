import type { ProvenanceState, RunState } from "../orchestrator/state.js";
import type { RunStore } from "../orchestrator/run-store.js";

export function defaultProvenanceState(): ProvenanceState {
  return {
    key: { status: "unknown" },
    statement: { status: "not_started" },
    signature: { status: "not_started" },
    checksums: { status: "not_started" },
    evidence: { status: "not_started" },
    githubReleaseDraft: { status: "not_started" }
  };
}

export function ensureProvenanceState(state: RunState): ProvenanceState {
  const defaults = defaultProvenanceState();
  state.provenance = {
    ...defaults,
    ...state.provenance,
    key: { ...defaults.key, ...state.provenance?.key },
    statement: { ...defaults.statement, ...state.provenance?.statement },
    signature: { ...defaults.signature, ...state.provenance?.signature },
    checksums: { ...defaults.checksums, ...state.provenance?.checksums },
    evidence: { ...defaults.evidence, ...state.provenance?.evidence },
    githubReleaseDraft: {
      ...defaults.githubReleaseDraft,
      ...state.provenance?.githubReleaseDraft
    }
  };
  return state.provenance;
}

export async function updateProvenanceState(
  store: RunStore,
  runId: string,
  update: (provenance: ProvenanceState, state: RunState) => void
): Promise<RunState> {
  const state = await store.readState(runId);
  const provenance = ensureProvenanceState(state);
  update(provenance, state);
  state.updatedAt = new Date().toISOString();
  await store.writeState(state);
  return state;
}
