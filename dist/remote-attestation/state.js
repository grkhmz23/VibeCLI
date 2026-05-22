export function defaultRemoteAttestationState() {
    return {
        export: { status: "not_started" },
        transparency: { status: "not_started" },
        submission: { status: "not_started" },
        registryMetadata: { status: "not_started" }
    };
}
export function ensureRemoteAttestationState(state) {
    const defaults = defaultRemoteAttestationState();
    state.remoteAttestation = {
        ...defaults,
        ...state.remoteAttestation,
        export: { ...defaults.export, ...state.remoteAttestation?.export },
        transparency: { ...defaults.transparency, ...state.remoteAttestation?.transparency },
        submission: { ...defaults.submission, ...state.remoteAttestation?.submission },
        registryMetadata: {
            ...defaults.registryMetadata,
            ...state.remoteAttestation?.registryMetadata
        }
    };
    return state.remoteAttestation;
}
export async function updateRemoteAttestationState(store, runId, update) {
    const state = await store.readState(runId);
    const remoteAttestation = ensureRemoteAttestationState(state);
    update(remoteAttestation, state);
    state.updatedAt = new Date().toISOString();
    await store.writeState(state);
    return state;
}
//# sourceMappingURL=state.js.map