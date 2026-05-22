import type { VibeConfig } from "../config/schema.js";

export type BudgetReport = {
  runId: string;
  createdAt: string;
  policy: {
    maxRunCostUsd: number | null;
    maxAgentCostUsd: number | null;
    maxRepairCostUsd: number | null;
    maxLiveAgentsPerRun: number | null;
    maxTotalTokensPerRun: number | null;
    stopOnBudgetRisk: boolean;
  };
  status: "within_budget" | "warning" | "blocked" | "exceeded" | "unknown";
  knownCostUsd: number | null;
  knownTokens: number | null;
  warnings: string[];
  blockedReason: string | null;
};

export function budgetPolicy(
  config: VibeConfig,
  overrideMaxRunCostUsd?: number
): BudgetReport["policy"] {
  return {
    maxRunCostUsd: overrideMaxRunCostUsd ?? config.budget.max_run_cost_usd ?? null,
    maxAgentCostUsd: config.budget.max_agent_cost_usd ?? null,
    maxRepairCostUsd: config.budget.max_repair_cost_usd ?? null,
    maxLiveAgentsPerRun: config.budget.max_live_agents_per_run ?? null,
    maxTotalTokensPerRun: config.budget.max_total_tokens_per_run ?? null,
    stopOnBudgetRisk: config.budget.stop_on_budget_risk ?? true
  };
}
