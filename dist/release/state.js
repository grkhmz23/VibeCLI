export function defaultReleaseState() {
    return {
        packet: { status: "not_started" },
        changelog: { status: "not_started" },
        version: { status: "not_started" },
        releaseBranch: { status: "not_started" },
        tag: { status: "not_started" },
        ci: { status: "not_started" },
        deploymentReadiness: { verdict: "not_started" },
        releaseReadiness: { verdict: "not_started" }
    };
}
export function ensureReleaseState(state) {
    state.release = {
        ...defaultReleaseState(),
        ...state.release,
        packet: { ...defaultReleaseState().packet, ...state.release?.packet },
        changelog: { ...defaultReleaseState().changelog, ...state.release?.changelog },
        version: { ...defaultReleaseState().version, ...state.release?.version },
        releaseBranch: { ...defaultReleaseState().releaseBranch, ...state.release?.releaseBranch },
        tag: { ...defaultReleaseState().tag, ...state.release?.tag },
        ci: { ...defaultReleaseState().ci, ...state.release?.ci },
        deploymentReadiness: {
            ...defaultReleaseState().deploymentReadiness,
            ...state.release?.deploymentReadiness
        },
        releaseReadiness: {
            ...defaultReleaseState().releaseReadiness,
            ...state.release?.releaseReadiness
        }
    };
    return state.release;
}
export async function updateReleaseState(store, runId, update) {
    const state = await store.readState(runId);
    const release = ensureReleaseState(state);
    update(release, state);
    state.updatedAt = new Date().toISOString();
    await store.writeState(state);
    return state;
}
//# sourceMappingURL=state.js.map