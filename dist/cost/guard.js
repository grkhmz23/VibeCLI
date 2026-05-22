import { RunStore } from "../orchestrator/run-store.js";
import { budgetPolicy } from "./budget.js";
export function buildBudgetReport(args) {
    const policy = budgetPolicy(args.config, args.overrideMaxRunCostUsd);
    const knownTokens = args.usage?.reduce((sum, entry) => sum + (entry.totalTokens ?? 0), 0) ?? null;
    const warnings = [...(args.warnings ?? [])];
    let status = "within_budget";
    let blockedReason = null;
    if (knownTokens !== null &&
        policy.maxTotalTokensPerRun !== null &&
        knownTokens > policy.maxTotalTokensPerRun) {
        status = "exceeded";
        blockedReason = `Known token usage ${knownTokens} exceeds max_total_tokens_per_run ${policy.maxTotalTokensPerRun}`;
    }
    else if ((args.usage?.length ?? 0) > 0) {
        status = "unknown";
        warnings.push("Pricing is unknown for at least one model; exact cost is not claimed.");
    }
    return {
        runId: args.runId,
        createdAt: new Date().toISOString(),
        policy,
        status,
        knownCostUsd: null,
        knownTokens,
        warnings,
        blockedReason
    };
}
export async function writeBudgetReport(args) {
    const report = buildBudgetReport(args);
    await new RunStore(args.cwd).writeArtifact(args.runId, "budget-report.json", report);
    return report;
}
//# sourceMappingURL=guard.js.map