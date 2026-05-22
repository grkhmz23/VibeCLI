export function budgetPolicy(config, overrideMaxRunCostUsd) {
    return {
        maxRunCostUsd: overrideMaxRunCostUsd ?? config.budget.max_run_cost_usd ?? null,
        maxAgentCostUsd: config.budget.max_agent_cost_usd ?? null,
        maxRepairCostUsd: config.budget.max_repair_cost_usd ?? null,
        maxLiveAgentsPerRun: config.budget.max_live_agents_per_run ?? null,
        maxTotalTokensPerRun: config.budget.max_total_tokens_per_run ?? null,
        stopOnBudgetRisk: config.budget.stop_on_budget_risk ?? true
    };
}
//# sourceMappingURL=budget.js.map