import { loadConfig } from "../config/config.js";
import { RunStore } from "../orchestrator/run-store.js";
import { readJson, pathExists } from "../utils/fs.js";
import { join } from "node:path";
import { readModelUsage } from "./usage.js";

export type CostEstimate = {
  runId: string;
  createdAt: string;
  known: boolean;
  estimatedUsd: number | null;
  currency: "USD";
  entries: Array<{
    agent: string;
    provider: string;
    model: string;
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
    estimatedUsd: number | null;
    pricingSource: "openrouter-models" | "config" | "unknown";
  }>;
  budget: {
    maxRunCostUsd: number | null;
    exceeded: boolean;
    status?: string;
  };
};

export async function estimateRunCost(cwd: string, runId: string): Promise<CostEstimate> {
  const usage = await readModelUsage(cwd, runId);
  const config = await loadConfig(cwd);
  const budgetPath = join(new RunStore(cwd).runPath(runId), "budget-report.json");
  const budgetReport = pathExists(budgetPath)
    ? await readJson<{ status?: string; policy?: { maxRunCostUsd?: number | null } }>(
        budgetPath
      ).catch(() => undefined)
    : undefined;
  const entries = usage.map((entry) => ({
    ...entry,
    estimatedUsd: null,
    pricingSource: "unknown" as const
  }));
  const estimate: CostEstimate = {
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
