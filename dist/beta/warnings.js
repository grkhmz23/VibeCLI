import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathExists, readJson, writeJson } from "../utils/fs.js";
import { redactDogfoodText } from "../dogfood/redaction.js";
import { updateBetaState } from "./config.js";
import { applyAcceptances, readWarningAcceptances, writeWarningAcceptances } from "./warning-store.js";
export async function collectBetaWarnings(cwd) {
    const reportsDir = join(cwd, ".vibecli", "dogfood", "reports");
    const warnings = [];
    await collectDocsWarnings(warnings, join(reportsDir, "DOCS_CHECK.json"));
    await collectScannerWarnings(warnings, join(reportsDir, "SCANNER_READINESS.json"));
    await collectPackageWarnings(warnings, join(reportsDir, "PACKAGE_CHECK.json"));
    await collectBetaWarningsFromReadiness(warnings, join(reportsDir, "BETA_READINESS.json"));
    await collectBacklogWarnings(warnings, join(reportsDir, "BETA_BACKLOG.json"));
    collectDogfoodWarnings(warnings, join(reportsDir));
    const acceptances = await readWarningAcceptances(cwd);
    const report = summarize(applyAcceptances(dedupe(warnings), acceptances));
    const path = join(cwd, ".vibecli", "beta", "reports", "BETA_WARNINGS.json");
    await writeJson(path, report);
    await writeFile(join(cwd, ".vibecli", "beta", "reports", "BETA_WARNINGS.md"), `# Beta Warnings\n\nOpen: ${report.summary.open}\nAccepted: ${report.summary.accepted}\nResolved: ${report.summary.resolved}\nBlocking open: ${report.summary.blockingOpen}\n`, "utf8");
    await updateBetaState(cwd, {
        latestReports: { betaWarnings: path },
        warnings: report.summary.open,
        acceptedWarnings: report.summary.accepted,
        blockers: report.summary.blockingOpen
    });
    return report;
}
export async function acceptBetaWarning(cwd, id, options) {
    const expected = `${options.resolve ? "RESOLVE" : "ACCEPT"} BETA WARNING ${id}`;
    if (options.confirm !== expected)
        throw new Error(`Beta warning update requires exact confirmation: "${expected}"`);
    if (!options.by?.trim())
        throw new Error("Beta warning update requires --by");
    if (!options.reason?.trim())
        throw new Error("Beta warning update requires --reason");
    const current = await collectBetaWarnings(cwd);
    const warning = current.warnings.find((item) => item.id === id);
    if (!warning)
        throw new Error(`Beta warning ${id} was not found`);
    if (!options.resolve && options.strict && warning.severity === "high") {
        throw new Error("High-severity beta warnings cannot be accepted under strict mode");
    }
    const acceptances = await readWarningAcceptances(cwd);
    acceptances.updatedAt = new Date().toISOString();
    acceptances.warnings[id] = {
        status: options.resolve ? "resolved" : "accepted",
        by: redactDogfoodText(options.by, 200),
        reason: redactDogfoodText(options.reason, 1000),
        at: new Date().toISOString()
    };
    await writeWarningAcceptances(cwd, acceptances);
    return collectBetaWarnings(cwd);
}
function summarize(warnings) {
    return {
        createdAt: new Date().toISOString(),
        warnings,
        summary: {
            open: warnings.filter((item) => item.status === "open").length,
            accepted: warnings.filter((item) => item.status === "accepted").length,
            resolved: warnings.filter((item) => item.status === "resolved").length,
            blockingOpen: warnings.filter((item) => item.status === "open" && item.blockingByDefault)
                .length
        }
    };
}
function add(warnings, source, category, message, options = {}) {
    warnings.push({
        id: `${category}-${source}-${warnings.length + 1}`.replace(/[^a-z0-9_-]/gi, "-").toLowerCase(),
        source,
        category,
        severity: options.severity ?? "medium",
        message: redactDogfoodText(message, 1000),
        blockingByDefault: options.blocking ?? false,
        status: "open",
        acceptedBy: null,
        acceptanceReason: null,
        acceptedAt: null
    });
}
function dedupe(warnings) {
    const seen = new Set();
    return warnings
        .filter((warning) => {
        const key = `${warning.source}:${warning.category}:${warning.message}`;
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    })
        .map((warning, index) => ({
        ...warning,
        id: `${warning.category}-${String(index + 1).padStart(3, "0")}`
    }));
}
async function collectDocsWarnings(warnings, path) {
    if (!pathExists(path))
        return add(warnings, "docs-check", "docs", "Docs check has not been run.", {
            severity: "medium",
            blocking: true
        });
    const report = await readJson(path);
    for (const blocker of report.blockers ?? [])
        add(warnings, "docs-check", "docs", blocker, { severity: "high", blocking: true });
    for (const warning of report.warnings ?? [])
        add(warnings, "docs-check", "docs", warning, { severity: "medium" });
}
async function collectScannerWarnings(warnings, path) {
    if (!pathExists(path))
        return add(warnings, "scanner-check", "scanner", "Scanner readiness has not been run.", {
            severity: "low"
        });
    const report = await readJson(path);
    if ((report.summary?.missing ?? 0) > 0)
        add(warnings, "scanner-check", "scanner", `${report.summary?.missing ?? 0} optional scanners missing.`, { severity: "low" });
    if ((report.summary?.failed ?? 0) > 0)
        add(warnings, "scanner-check", "scanner", `${report.summary?.failed ?? 0} scanner checks failed.`, { severity: "medium" });
}
async function collectPackageWarnings(warnings, path) {
    if (!pathExists(path))
        return add(warnings, "package-check", "package", "Package check has not been run.", {
            severity: "medium",
            blocking: true
        });
    const report = await readJson(path);
    for (const blocker of report.blockers ?? [])
        add(warnings, "package-check", "package", blocker, { severity: "high", blocking: true });
    for (const warning of report.warnings ?? [])
        add(warnings, "package-check", "package", warning, { severity: "medium" });
}
async function collectBetaWarningsFromReadiness(warnings, path) {
    if (!pathExists(path))
        return;
    const report = await readJson(path);
    for (const blocker of report.blockers ?? [])
        add(warnings, "beta-check", "other", blocker, { severity: "high", blocking: true });
    for (const warning of report.warnings ?? [])
        add(warnings, "beta-check", "other", warning, { severity: "medium" });
}
async function collectBacklogWarnings(warnings, path) {
    if (!pathExists(path))
        return;
    const report = await readJson(path);
    for (const item of report.items ?? []) {
        add(warnings, "beta-backlog", "other", item.title, {
            severity: item.priority === "p0" || item.priority === "p1" ? "high" : "low",
            blocking: item.blockingBeta
        });
    }
}
function collectDogfoodWarnings(warnings, reportsDir) {
    const statePath = join(reportsDir, "BETA_READINESS.json");
    if (!pathExists(statePath))
        add(warnings, "dogfood", "dogfood", "Dogfood beta readiness has not been refreshed.", {
            severity: "low"
        });
}
//# sourceMappingURL=warnings.js.map