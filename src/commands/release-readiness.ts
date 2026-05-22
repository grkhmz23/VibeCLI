import type { Command } from "commander";
import { evaluateReleaseReadiness } from "../release/release-readiness.js";

export function registerReleaseReadinessCommand(program: Command): void {
  program
    .command("release-readiness")
    .argument("<run-id>", "run id")
    .option("--channel <channel>", "release channel")
    .option("--json", "print JSON")
    .description("Compute governed release-readiness verdict")
    .action(async (runId: string, options: { channel?: string; json?: boolean }) => {
      const result = await evaluateReleaseReadiness(process.cwd(), runId, {
        channel: options.channel
      });
      console.log(options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2));
    });
}
