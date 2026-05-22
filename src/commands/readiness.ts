import type { Command } from "commander";
import { createHandoffBundle } from "../handoff/bundle.js";
import { evaluateReadiness } from "../handoff/readiness.js";
import { RunStore } from "../orchestrator/run-store.js";
import { refreshLedgerAfterOperation } from "../ledger/events.js";

export function registerReadinessCommand(program: Command): void {
  program
    .command("readiness")
    .argument("<run-id>", "run id")
    .option("--json", "print JSON")
    .option("--refresh", "refresh handoff before evaluating")
    .description("Evaluate release readiness for PR handoff")
    .action(async (runId: string, options: { json?: boolean; refresh?: boolean }) => {
      if (options.refresh) await createHandoffBundle(process.cwd(), runId);
      const result = await evaluateReadiness(process.cwd(), runId);
      const store = new RunStore(process.cwd());
      const state = await store.readState(runId);
      state.readiness = { verdict: result.verdict, checkedAt: new Date().toISOString() };
      await store.writeState(state);
      await store.writeArtifact(runId, "readiness-result.json", result);
      await refreshLedgerAfterOperation(process.cwd(), runId);
      console.log(
        options.json
          ? JSON.stringify(result, null, 2)
          : `Readiness ${result.verdict}: ${result.blockingReasons.join("; ") || "no blocking reasons"}`
      );
    });
}
