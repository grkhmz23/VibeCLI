import { join } from "node:path";
import { pathExists, readJson, writeJson } from "../utils/fs.js";
import { updateDogfoodState } from "./config.js";
import { updateBetaState } from "../beta/config.js";
export async function createBetaBacklog(cwd) {
    const reportsDir = join(cwd, ".vibecli", "dogfood", "reports");
    const items = [];
    const betaPath = join(reportsDir, "BETA_READINESS.json");
    if (pathExists(betaPath)) {
        const beta = await readJson(betaPath);
        for (const check of beta.checks.filter((item) => item.status === "failed" || item.status === "warning" || item.status === "not_run")) {
            items.push({
                id: `BETA-${String(items.length + 1).padStart(3, "0")}`,
                priority: check.blocking && check.status === "failed" ? "p0" : check.blocking ? "p1" : "p3",
                category: check.category,
                title: check.name,
                evidence: check.evidencePath ? [check.evidencePath] : [],
                recommendedFix: safeRecommendation(check.category),
                blockingBeta: check.blocking && check.status === "failed"
            });
        }
    }
    const report = {
        createdAt: new Date().toISOString(),
        items,
        summary: {
            p0: items.filter((item) => item.priority === "p0").length,
            p1: items.filter((item) => item.priority === "p1").length,
            p2: items.filter((item) => item.priority === "p2").length,
            p3: items.filter((item) => item.priority === "p3").length,
            blockingBeta: items.filter((item) => item.blockingBeta).length
        }
    };
    const path = join(reportsDir, "BETA_BACKLOG.json");
    await writeJson(path, report);
    await import("node:fs/promises").then((fs) => fs.writeFile(join(reportsDir, "BETA_BACKLOG.md"), `# Beta Backlog\n\nP0: ${report.summary.p0}\nP1: ${report.summary.p1}\nP3: ${report.summary.p3}\n`, "utf8"));
    await updateDogfoodState(cwd, { latestReports: { betaBacklog: path } });
    await updateBetaState(cwd, {
        latestReports: { betaBacklog: path },
        blockers: report.summary.blockingBeta
    });
    return report;
}
function safeRecommendation(category) {
    switch (category) {
        case "security":
            return "Run vibe security-redteam and address the local safety failure.";
        case "package":
            return "Run pnpm build and vibe package-check, then fix package metadata or packaging exclusions.";
        case "docs":
            return "Run vibe docs-check and update README/SECURITY safety documentation.";
        case "dogfood":
            return "Run vibe dogfood run and inspect the fixture report.";
        default:
            return "Rerun the corresponding local check and update the blocker evidence.";
    }
}
//# sourceMappingURL=backlog.js.map