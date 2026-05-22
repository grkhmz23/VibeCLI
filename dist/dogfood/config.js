import { join } from "node:path";
import { pathExists, readJson, writeJson } from "../utils/fs.js";
export const dogfoodStatePath = ".vibecli/dogfood/DOGFOOD_STATE.json";
export function defaultDogfoodState() {
    return {
        updatedAt: new Date().toISOString(),
        latestDogfoodRunId: null,
        latestBetaVerdict: "unknown",
        latestReports: {
            dogfood: null,
            securityRedteam: null,
            packageCheck: null,
            docsCheck: null,
            perfCheck: null,
            betaCheck: null,
            betaBacklog: null
        }
    };
}
export async function readDogfoodState(cwd) {
    const path = join(cwd, dogfoodStatePath);
    return pathExists(path) ? readJson(path) : defaultDogfoodState();
}
export async function updateDogfoodState(cwd, update) {
    const current = await readDogfoodState(cwd);
    const next = {
        ...current,
        ...update,
        updatedAt: new Date().toISOString(),
        latestReports: { ...current.latestReports, ...(update.latestReports ?? {}) }
    };
    await writeJson(join(cwd, dogfoodStatePath), next);
    return next;
}
//# sourceMappingURL=config.js.map