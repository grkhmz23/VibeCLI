import { join } from "node:path";
import { pathExists, readJson, writeJson } from "../utils/fs.js";
export const betaStatePath = ".vibecli/beta/BETA_STATE.json";
export function defaultBetaState() {
    return {
        updatedAt: new Date().toISOString(),
        latestBetaVerdict: "unknown",
        latestRcReport: null,
        latestDogfoodRunId: null,
        latestReports: {
            dogfood: null,
            dogfoodApplySmoke: null,
            liveSmoke: null,
            scannerCheck: null,
            securityRedteam: null,
            packageCheck: null,
            packageInstallCheck: null,
            docsCheck: null,
            docsStrictCheck: null,
            perfCheck: null,
            betaCheck: null,
            betaWarnings: null,
            betaBacklog: null,
            betaRc: null
        },
        blockers: 0,
        warnings: 0,
        acceptedWarnings: 0
    };
}
export async function readBetaState(cwd) {
    const path = join(cwd, betaStatePath);
    return pathExists(path) ? readJson(path) : defaultBetaState();
}
export async function updateBetaState(cwd, update) {
    const current = await readBetaState(cwd);
    const next = {
        ...current,
        ...update,
        updatedAt: new Date().toISOString(),
        latestReports: { ...current.latestReports, ...(update.latestReports ?? {}) }
    };
    await writeJson(join(cwd, betaStatePath), next);
    return next;
}
//# sourceMappingURL=config.js.map