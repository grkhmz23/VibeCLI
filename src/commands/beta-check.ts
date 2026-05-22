import type { Command } from "commander";
import { runBetaCheck } from "../dogfood/beta-readiness.js";

export function registerBetaCheckCommand(program: Command): void {
  program
    .command("beta-check")
    .option("--strict", "require all beta reports")
    .option("--json", "print JSON")
    .description("Aggregate local beta readiness")
    .action(async (options: { strict?: boolean; json?: boolean }) => {
      const result = await runBetaCheck(process.cwd(), { strict: options.strict });
      console.log(
        options.json ? JSON.stringify(result, null, 2) : `Beta readiness: ${result.verdict}`
      );
    });
}
