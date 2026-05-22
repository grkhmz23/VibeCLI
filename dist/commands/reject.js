import { refreshLedgerAfterOperation } from "../ledger/events.js";
import { rejectRun } from "../orchestrator/approval.js";
export function registerRejectCommand(program) {
    program
        .command("reject")
        .argument("<run-id>", "run id")
        .description("Reject a run without deleting artifacts")
        .action(async (runId) => {
        await rejectRun(process.cwd(), runId);
        await refreshLedgerAfterOperation(process.cwd(), runId);
        console.log(`Run ${runId} rejected.`);
    });
}
//# sourceMappingURL=reject.js.map