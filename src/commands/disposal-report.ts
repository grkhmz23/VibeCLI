import type { Command } from "commander";
import { createDisposalReport } from "../evidence-disposal/cross-run.js";

export function registerDisposalReportCommand(program: Command): void {
  program
    .command("disposal-report")
    .description("Create cross-run local disposal planning report")
    .option("--deep", "perform deeper safe metadata scan")
    .option("--json", "print JSON")
    .action(async (options: { deep?: boolean; json?: boolean }) => {
      const result = await createDisposalReport(process.cwd(), { deep: options.deep });
      console.log(
        options.json
          ? JSON.stringify(result, null, 2)
          : `Disposal report: ${result.summary.totalRuns} runs, ${result.summary.eligibleRuns} eligible`
      );
    });
}
