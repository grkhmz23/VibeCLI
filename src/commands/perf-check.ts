import type { Command } from "commander";
import { runPerfCheck } from "../dogfood/performance.js";

export function registerPerfCheckCommand(program: Command): void {
  program
    .command("perf-check")
    .option("--json", "print JSON")
    .description("Measure safe local command performance and artifact sizes")
    .action(async (options: { json?: boolean }) => {
      const result = await runPerfCheck(process.cwd());
      console.log(
        options.json
          ? JSON.stringify(result, null, 2)
          : `Perf check: ${result.summary.warnings} warnings, ${result.summary.failures} failures`
      );
    });
}
