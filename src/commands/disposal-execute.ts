import type { Command } from "commander";
import { dryRunDisposal, executeDisposal } from "../evidence-disposal/delete.js";

export function registerDisposalExecuteCommand(program: Command): void {
  program
    .command("disposal-execute")
    .argument("<run-id>", "run id")
    .description("Execute exact-confirmed local disposal of approved run evidence candidates")
    .option("--dry-run", "run prechecks without deleting")
    .option("--confirm <confirm>", "exact confirmation")
    .option("--json", "print JSON")
    .action(
      async (runId: string, options: { dryRun?: boolean; confirm?: string; json?: boolean }) => {
        if (options.dryRun) {
          const result = await dryRunDisposal(process.cwd(), runId);
          console.log(
            options.json
              ? JSON.stringify(result, null, 2)
              : `Disposal dry-run ${result.ok ? "PASS" : "FAIL"}: ${result.candidates} candidates`
          );
          if (!result.ok) process.exitCode = 1;
          return;
        }
        if (!options.confirm) {
          console.log(`Disposal refused. Required exact confirmation: DELETE EVIDENCE ${runId}`);
          process.exitCode = 1;
          return;
        }
        const result = await executeDisposal(process.cwd(), runId, { confirm: options.confirm });
        console.log(
          options.json
            ? JSON.stringify(result, null, 2)
            : `Disposal ${result.status}: deleted ${result.deleted.length} files`
        );
        if (result.status === "failed") process.exitCode = 1;
      }
    );
}
