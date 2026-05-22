export function defaultEvidenceDisposalState() {
    return {
        eligibility: { status: "not_started" },
        candidates: { status: "not_started" },
        plan: { status: "not_started" },
        attestation: { status: "not_started" },
        approvals: { status: "not_started" },
        precheck: { status: "not_started" },
        execution: { status: "not_started" },
        ledger: { status: "not_started" }
    };
}
export function ensureEvidenceDisposalState(state) {
    const base = defaultEvidenceDisposalState();
    state.evidenceDisposal = {
        ...base,
        ...state.evidenceDisposal,
        eligibility: { ...base.eligibility, ...state.evidenceDisposal?.eligibility },
        candidates: { ...base.candidates, ...state.evidenceDisposal?.candidates },
        plan: { ...base.plan, ...state.evidenceDisposal?.plan },
        attestation: { ...base.attestation, ...state.evidenceDisposal?.attestation },
        approvals: { ...base.approvals, ...state.evidenceDisposal?.approvals },
        precheck: { ...base.precheck, ...state.evidenceDisposal?.precheck },
        execution: { ...base.execution, ...state.evidenceDisposal?.execution },
        ledger: { ...base.ledger, ...state.evidenceDisposal?.ledger }
    };
    return state.evidenceDisposal;
}
export async function updateEvidenceDisposalState(store, runId, updater) {
    const state = await store.readState(runId);
    const disposal = ensureEvidenceDisposalState(state);
    updater(disposal, state);
    state.updatedAt = new Date().toISOString();
    await store.writeState(state);
    return state;
}
//# sourceMappingURL=state.js.map