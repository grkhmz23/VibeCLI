import type { Command } from "commander";
import { runPackageCheck } from "../dogfood/package-check.js";

export function registerPackageCheckCommand(program: Command): void {
  program
    .command("package-check")
    .option("--json", "print JSON")
    .description("Check package/install readiness without publishing")
    .action(async (options: { json?: boolean }) => {
      const result = await runPackageCheck(process.cwd());
      console.log(
        options.json
          ? JSON.stringify(result, null, 2)
          : `Package check: ${result.summary.passed} passed, ${result.summary.failed} failed`
      );
    });
}
