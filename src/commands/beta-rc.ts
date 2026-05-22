import type { Command } from "commander";
import { createBetaRcReport } from "../beta/rc-report.js";
import type { BetaChannel } from "../beta/types.js";

export function registerBetaRcCommand(program: Command): void {
  program
    .command("beta-rc")
    .option("--channel <channel>", "private-beta, closed-beta, or public-beta")
    .option("--strict", "strict RC gates")
    .option("--json", "print JSON")
    .description("Generate local beta release-candidate gate report")
    .action(async (options: { channel?: BetaChannel; strict?: boolean; json?: boolean }) => {
      const result = await createBetaRcReport(process.cwd(), {
        channel: options.channel,
        strict: options.strict
      });
      console.log(
        options.json
          ? JSON.stringify(result, null, 2)
          : `Beta RC: ${result.verdict} (${result.blockers.length} blockers, ${result.warnings.length} warnings)`
      );
    });
}
