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
export declare function budgetPolicy(config: VibeConfig, overrideMaxRunCostUsd?: number): BudgetReport["policy"];
