import type { Command } from "commander";
import { refreshLedgerAfterOperation } from "../ledger/events.js";
import { verifyRun } from "../orchestrator/verify.js";

export function registerVerifyCommand(program: Command): void {
  program
    .command("verify")
    .argument("<run-id>", "run id")
    .option("--confirm <confirmation>", "exact confirmation string")
    .option("--all", "run all available verification commands")
    .option("--test", "run test script")
    .option("--build", "run build script")
    .option("--lint", "run lint script")
    .option("--typecheck", "run typecheck script")
    .option("--timeout-ms <number>", "timeout per command")
    .option("--json", "print JSON")
    .description("Run explicit approved project verification")
    .action(
      async (
        runId: string,
        options: {
          confirm?: string;
          all?: boolean;
          test?: boolean;
          build?: boolean;
          lint?: boolean;
          typecheck?: boolean;
          timeoutMs?: string;
          json?: boolean;
        }
      ) => {
        if (!options.confirm) {
          console.log(`Available verification commands require confirmation: VERIFY ${runId}`);
          return;
        }
        const names = options.all
          ? undefined
          : ([
              options.typecheck ? "typecheck" : undefined,
              options.lint ? "lint" : undefined,
              options.test ? "test" : undefined,
              options.build ? "build" : undefined
            ].filter(Boolean) as Array<"typecheck" | "lint" | "test" | "build">);
        const result = await verifyRun(process.cwd(), runId, {
          confirm: options.confirm,
          names,
          timeoutMs: options.timeoutMs ? Number.parseInt(options.timeoutMs, 10) : undefined
        });
        await refreshLedgerAfterOperation(process.cwd(), runId);
        console.log(
          options.json
            ? JSON.stringify(result, null, 2)
            : `Verification ${result.status}: ${result.commands.map((command) => `${command.name}:${command.status}`).join(", ")}`
        );
      }
    );
}
