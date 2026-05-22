import { refreshLedgerAfterOperation } from "../ledger/events.js";
import { repairRun } from "../orchestrator/repair.js";
import { loadConfig } from "../config/config.js";
import { RunStore } from "../orchestrator/run-store.js";
import { buildRepairPlan } from "../orchestrator/repair-planner.js";
export function registerRepairCommand(program) {
    program
        .command("repair")
        .argument("<run-id>", "run id")
        .option("--live", "call Fixer Agent provider")
        .option("--dry-run", "check repair eligibility without provider call")
        .option("--plan", "create repair plan without provider call")
        .option("--confirm <confirmation>", "exact confirmation string")
        .option("--json", "print JSON")
        .description("Propose repair patches after failed gates")
        .action(async (runId, options) => {
        if (options.plan) {
            const config = await loadConfig(process.cwd());
            const state = await new RunStore(process.cwd()).readState(runId);
            const result = await buildRepairPlan({
                cwd: process.cwd(),
                runId,
                config,
                profile: config.default_profile,
                cycle: (state.repair?.cyclesUsed ?? 0) + 1
            });
            await refreshLedgerAfterOperation(process.cwd(), runId);
            console.log(options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2));
            return;
        }
        if (options.live)
            console.log("Repair live mode may spend provider credits.");
        const result = await repairRun(process.cwd(), runId, {
            live: Boolean(options.live),
            dryRun: Boolean(options.dryRun),
            confirm: options.confirm
        });
        await refreshLedgerAfterOperation(process.cwd(), runId);
        console.log(options.json ? JSON.stringify(result, null, 2) : result.message);
    });
}
//# sourceMappingURL=repair.js.map