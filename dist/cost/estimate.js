import { loadConfig } from "../config/config.js";
import { RunStore } from "../orchestrator/run-store.js";
import { readJson, pathExists } from "../utils/fs.js";
import { join } from "node:path";
import { readModelUsage } from "./usage.js";
export async function estimateRunCost(cwd, runId) {
    const usage = await readModelUsage(cwd, runId);
    const config = await loadConfig(cwd);
    const budgetPath = join(new RunStore(cwd).runPath(runId), "budget-report.json");
    const budgetReport = pathExists(budgetPath)
        ? await readJson(budgetPath).catch(() => undefined)
        : undefined;
    const entries = usage.map((entry) => ({
        ...entry,
        estimatedUsd: null,
        pricingSource: "unknown"
    }));
    const estimate = {
        runId,
        createdAt: new Date().toISOString(),
        known: false,
        estimatedUsd: null,
        currency: "USD",
        entries,
        budget: {
            maxRunCostUsd: config.budget.max_run_cost_usd ?? null,
            exceeded: budgetReport?.status === "exceeded",
            status: budgetReport?.status
        }
    };
    await new RunStore(cwd).writeArtifact(runId, "cost-estimate.json", estimate);
    return estimate;
}
//# sourceMappingURL=estimate.js.map