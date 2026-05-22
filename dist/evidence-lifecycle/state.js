export function defaultEvidenceLifecycleState() {
    return {
        inventory: { status: "not_started" },
        retentionEnforcement: { status: "not_started", purgeImplemented: false },
        archive: { status: "not_started" },
        retentionLedger: { status: "not_started" },
        legalHold: { status: "not_started" },
        compaction: { status: "not_started" },
        report: { status: "not_started" }
    };
}
export function ensureEvidenceLifecycleState(state) {
    const base = defaultEvidenceLifecycleState();
    state.evidenceLifecycle = {
        ...base,
        ...state.evidenceLifecycle,
        inventory: { ...base.inventory, ...state.evidenceLifecycle?.inventory },
        retentionEnforcement: {
            ...base.retentionEnforcement,
            ...state.evidenceLifecycle?.retentionEnforcement
        },
        archive: { ...base.archive, ...state.evidenceLifecycle?.archive },
        retentionLedger: { ...base.retentionLedger, ...state.evidenceLifecycle?.retentionLedger },
        legalHold: { ...base.legalHold, ...state.evidenceLifecycle?.legalHold },
        compaction: { ...base.compaction, ...state.evidenceLifecycle?.compaction },
        report: { ...base.report, ...state.evidenceLifecycle?.report }
    };
    return state.evidenceLifecycle;
}
export async function updateEvidenceLifecycleState(store, runId, updater) {
    const state = await store.readState(runId);
    const evidenceLifecycle = ensureEvidenceLifecycleState(state);
    updater(evidenceLifecycle, state);
    state.updatedAt = new Date().toISOString();
    await store.writeState(state);
    return state;
}
//# sourceMappingURL=state.js.map