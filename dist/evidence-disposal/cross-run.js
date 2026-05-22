import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { runsPath } from "../config/config.js";
import { ensureDir, pathExists, readJson, writeJson } from "../utils/fs.js";
export async function createDisposalReport(cwd, options = {}) {
    const runsDir = join(cwd, runsPath);
    const entries = pathExists(runsDir) ? await readdir(runsDir, { withFileTypes: true }) : [];
    const runs = await Promise.all(entries
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => summarizeRun(cwd, entry.name)));
    const report = {
        createdAt: new Date().toISOString(),
        runs,
        summary: {
            totalRuns: runs.length,
            eligibleRuns: runs.filter((run) => run.eligible).length,
            blockedByLegalHold: runs.filter((run) => run.legalHold).length,
            blockedByRetention: runs.filter((run) => !run.retentionExpired).length,
            blockedByArchive: runs.filter((run) => !run.archiveVerified).length,
            completedDisposals: runs.filter((run) => run.disposalStatus === "completed").length,
            candidateBytes: runs.reduce((sum, run) => sum + run.candidateBytes, 0)
        },
        nextActions: ["Run vibe disposal-eligibility <run-id> before any exact-confirmed disposal."],
        warnings: [
            options.deep
                ? "Deep report still avoids blocked files and performs no deletion."
                : "Metadata-only disposal report. No deletion or remote calls were performed."
        ]
    };
    const outputDir = join(cwd, ".vibecli", "evidence-lifecycle", "disposal");
    await ensureDir(outputDir);
    await writeJson(join(outputDir, "DISPOSAL_REPORT.json"), report);
    await import("node:fs/promises").then((fs) => fs.writeFile(join(outputDir, "DISPOSAL_REPORT.md"), renderReport(report), "utf8"));
    return report;
}
async function summarizeRun(cwd, runId) {
    const root = join(cwd, runsPath, runId, "evidence-lifecycle", "disposal");
    const eligibility = pathExists(join(root, "DISPOSAL_ELIGIBILITY.json"))
        ? await readJson(join(root, "DISPOSAL_ELIGIBILITY.json")).catch(() => undefined)
        : undefined;
    const candidates = pathExists(join(root, "DISPOSAL_CANDIDATES.json"))
        ? await readJson(join(root, "DISPOSAL_CANDIDATES.json")).catch(() => undefined)
        : undefined;
    const receipt = pathExists(join(root, "DISPOSAL_RECEIPT.json"))
        ? await readJson(join(root, "DISPOSAL_RECEIPT.json")).catch(() => undefined)
        : undefined;
    const disposalStatus = receipt?.status ??
        (eligibility?.eligible ? "planned" : eligibility ? "blocked" : "not_started");
    return {
        runId,
        eligible: Boolean(eligibility?.eligible),
        legalHold: Boolean(eligibility?.retention.legalHold),
        retentionExpired: Boolean(eligibility?.retention.expired),
        archiveVerified: Boolean(eligibility?.archive.verified),
        approvalStatus: eligibility?.organizationApproval.status ?? "unknown",
        candidateFiles: candidates?.summary.candidateFiles ?? 0,
        candidateBytes: candidates?.summary.candidateBytes ?? 0,
        disposalStatus,
        blockingReasons: eligibility?.blockingReasons ?? []
    };
}
function renderReport(report) {
    return `# Disposal Report

Runs: ${report.summary.totalRuns}
Eligible runs: ${report.summary.eligibleRuns}
Completed disposals: ${report.summary.completedDisposals}
Candidate bytes: ${report.summary.candidateBytes}

No evidence was deleted by this report.
`;
}
//# sourceMappingURL=cross-run.js.map