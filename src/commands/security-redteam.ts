import type { Command } from "commander";
import { runSecurityRedteam } from "../dogfood/redteam.js";

export function registerSecurityRedteamCommand(program: Command): void {
  program
    .command("security-redteam")
    .option("--json", "print JSON")
    .description("Run local safety red-team harness")
    .action(async (options: { json?: boolean }) => {
      const result = await runSecurityRedteam(process.cwd());
      console.log(
        options.json
          ? JSON.stringify(result, null, 2)
          : `Security red-team: ${result.summary.passed} passed, ${result.summary.failed} failed`
      );
    });
}
