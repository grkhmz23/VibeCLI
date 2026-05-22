import type { Command } from "commander";
import { runDocsCheck } from "../dogfood/docs-coverage.js";

export function registerDocsCheckCommand(program: Command): void {
  program
    .command("docs-check")
    .option("--strict", "fail on warnings and write beta strict report")
    .option("--json", "print JSON")
    .description("Audit command surface and documentation coverage")
    .action(async (options: { strict?: boolean; json?: boolean }) => {
      const result = await runDocsCheck(process.cwd(), { strict: options.strict });
      console.log(
        options.json
          ? JSON.stringify(result, null, 2)
          : `Docs check: ${result.blockers.length} blockers, ${result.warnings.length} warnings`
      );
    });
}
