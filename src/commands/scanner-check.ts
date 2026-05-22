import type { Command } from "commander";
import { scannerReadiness } from "../dogfood/scanner-readiness.js";

export function registerScannerCheckCommand(program: Command): void {
  program
    .command("scanner-check")
    .option("--run-safe", "run safe local version/help commands")
    .option("--strict", "evaluate scanner gate policy")
    .option("--install-guide", "write scanner install guidance without installing")
    .option("--confirm <value>", "exact confirmation")
    .option("--json", "print JSON")
    .description("Check external scanner availability without network scans")
    .action(
      async (options: {
        runSafe?: boolean;
        strict?: boolean;
        installGuide?: boolean;
        confirm?: string;
        json?: boolean;
      }) => {
        const result = await scannerReadiness(process.cwd(), {
          runSafe: options.runSafe,
          confirm: options.confirm,
          strict: options.strict,
          installGuide: options.installGuide
        });
        console.log(
          options.json
            ? JSON.stringify(result, null, 2)
            : `Scanner readiness: ${result.summary.available} available, ${result.summary.missing} missing`
        );
      }
    );
}
