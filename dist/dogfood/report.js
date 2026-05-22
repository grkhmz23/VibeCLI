import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { loadConfig } from "../config/config.js";
import { pathExists, readJson, writeJson } from "../utils/fs.js";
import { updateDogfoodState } from "./config.js";
export function dogfoodRunId() {
    return `dogfood-${new Date()
        .toISOString()
        .replace(/[-:.TZ]/g, "")
        .slice(0, 14)}`;
}
export async function writeDogfoodReport(cwd, report) {
    const config = await loadConfig(cwd);
    const dir = join(cwd, config.dogfood.reports_dir, report.dogfoodRunId);
    const jsonPath = join(dir, "DOGFOOD_REPORT.json");
    await writeJson(jsonPath, report);
    await import("node:fs/promises").then((fs) => fs.writeFile(join(dir, "DOGFOOD_REPORT.md"), renderDogfoodReport(report), "utf8"));
    await updateDogfoodState(cwd, {
        latestDogfoodRunId: report.dogfoodRunId,
        latestReports: { dogfood: jsonPath }
    });
    return jsonPath;
}
export async function latestDogfoodReport(cwd) {
    const config = await loadConfig(cwd);
    const reportsDir = join(cwd, config.dogfood.reports_dir);
    if (!pathExists(reportsDir))
        return null;
    const entries = (await readdir(reportsDir, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory() && entry.name.startsWith("dogfood-"))
        .map((entry) => entry.name)
        .sort();
    const latest = entries.at(-1);
    if (!latest)
        return null;
    const path = join(reportsDir, latest, "DOGFOOD_REPORT.json");
    return pathExists(path) ? readJson(path) : null;
}
function renderDogfoodReport(report) {
    const rows = report.fixtures
        .map((fixture) => `- ${fixture.fixture}: ${fixture.status} run=${fixture.vibeRunId ?? "none"} ledger=${fixture.artifacts.ledgerVerified}`)
        .join("\n");
    return `# Dogfood Report

Run: ${report.dogfoodRunId}
Mode: ${report.mode}
Duration: ${report.summary.durationMs}ms

Passed: ${report.summary.passed}
Failed: ${report.summary.failed}
Skipped: ${report.summary.skipped}

## Fixtures

${rows || "- none"}

## Blockers

${report.blockers.map((item) => `- ${item}`).join("\n") || "- none"}

No providers were called by default. No real repo source was modified.
`;
}
//# sourceMappingURL=report.js.map