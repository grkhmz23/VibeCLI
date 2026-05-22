import type { VibeConfig } from "../config/schema.js";
import type { ModelUsageEntry } from "./usage.js";
import { type BudgetReport } from "./budget.js";
export declare function buildBudgetReport(args: {
    runId: string;
    config: VibeConfig;
    usage?: ModelUsageEntry[];
    overrideMaxRunCostUsd?: number;
    warnings?: string[];
}): BudgetReport;
export declare function writeBudgetReport(args: {
    cwd: string;
    runId: string;
    config: VibeConfig;
    usage?: ModelUsageEntry[];
    overrideMaxRunCostUsd?: number;
    warnings?: string[];
}): Promise<BudgetReport>;
