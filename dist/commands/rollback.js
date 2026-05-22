import { refreshLedgerAfterOperation } from "../ledger/events.js";
import { rollbackRun } from "../orchestrator/rollback.js";
export function registerRollbackCommand(program) {
    program
        .command("rollback")
        .argument("<run-id>", "run id")
        .option("--confirm <confirmation>", "exact confirmation string")
        .option("--dry-run", "validate rollback without modifying files")
        .option("--json", "print JSON")
        .description("Restore files from rollback artifacts")
        .action(async (runId, options) => {
        const result = await rollbackRun(process.cwd(), runId, {
            confirm: options.confirm,
            dryRun: Boolean(options.dryRun)
        });
        await refreshLedgerAfterOperation(process.cwd(), runId);
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : `Rollback ${result.status}: Rollback restored pre-apply state. Restored ${result.filesRestored.length}, deleted ${result.filesDeleted.length}`);
    });
}
//# sourceMappingURL=rollback.js.map