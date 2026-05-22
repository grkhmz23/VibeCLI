import type { Command } from "commander";
import { refreshLedgerAfterOperation } from "../ledger/events.js";
import { approveRun } from "../orchestrator/approval.js";

export function registerApproveCommand(program: Command): void {
  program
    .command("approve")
    .argument("<run-id>", "run id")
    .description("Record approval intent for a run without applying patches")
    .action(async (runId: string) => {
      console.log(await approveRun(process.cwd(), runId));
      await refreshLedgerAfterOperation(process.cwd(), runId);
    });
}
