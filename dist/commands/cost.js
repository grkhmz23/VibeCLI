import { estimateRunCost } from "../cost/estimate.js";
import { refreshLedgerAfterOperation } from "../ledger/events.js";
export function registerCostCommand(program) {
    program
        .command("cost")
        .argument("<run-id>", "run id")
        .option("--json", "print JSON")
        .description("Show model usage and estimated cost")
        .action(async (runId, options) => {
        const estimate = await estimateRunCost(process.cwd(), runId);
        await refreshLedgerAfterOperation(process.cwd(), runId);
        console.log(options.json
            ? JSON.stringify(estimate, null, 2)
            : `Cost estimate: ${estimate.known ? `$${estimate.estimatedUsd?.toFixed(4)}` : "unknown"} (${estimate.entries.length} usage entries)\nBudget: ${estimate.budget.status ?? "unknown"} max=${estimate.budget.maxRunCostUsd ?? "none"}`);
    });
}
//# sourceMappingURL=cost.js.map