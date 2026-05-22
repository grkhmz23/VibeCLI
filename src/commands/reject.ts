import type { Command } from "commander";
import { refreshLedgerAfterOperation } from "../ledger/events.js";
import { rejectRun } from "../orchestrator/approval.js";

export function registerRejectCommand(program: Command): void {
  program
    .command("reject")
    .argument("<run-id>", "run id")
    .description("Reject a run without deleting artifacts")
    .action(async (runId: string) => {
      await rejectRun(process.cwd(), runId);
      await refreshLedgerAfterOperation(process.cwd(), runId);
      console.log(`Run ${runId} rejected.`);
    });
}
