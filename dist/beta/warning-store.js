import { join } from "node:path";
import { pathExists, readJson, writeJson } from "../utils/fs.js";
export const acceptancesPath = ".vibecli/beta/reports/BETA_WARNING_ACCEPTANCES.json";
export async function readWarningAcceptances(cwd) {
    const path = join(cwd, acceptancesPath);
    return pathExists(path)
        ? readJson(path)
        : { updatedAt: new Date().toISOString(), warnings: {} };
}
export async function writeWarningAcceptances(cwd, acceptances) {
    await writeJson(join(cwd, acceptancesPath), acceptances);
}
export function applyAcceptances(warnings, acceptances) {
    return warnings.map((warning) => {
        const acceptance = acceptances.warnings[warning.id];
        if (!acceptance)
            return warning;
        return {
            ...warning,
            status: acceptance.status,
            acceptedBy: acceptance.by,
            acceptanceReason: acceptance.reason,
            acceptedAt: acceptance.at
        };
    });
}
//# sourceMappingURL=warning-store.js.map