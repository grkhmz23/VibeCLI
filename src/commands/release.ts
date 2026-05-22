import type { Command } from "commander";
import { generateReleasePacket } from "../release/packet.js";
import { verifyReleaseIntegrity } from "../release/integrity.js";

export function registerReleaseCommand(program: Command): void {
  program
    .command("release")
    .argument("<run-id>", "run id")
    .option("--channel <channel>", "release channel")
    .option("--json", "print JSON")
    .option("--verify", "verify release manifest")
    .option("--strict", "fail generation on blocking gates")
    .description("Generate or verify a governed release packet")
    .action(
      async (
        runId: string,
        options: { channel?: string; json?: boolean; verify?: boolean; strict?: boolean }
      ) => {
        const result = options.verify
          ? await verifyReleaseIntegrity(process.cwd(), runId)
          : await generateReleasePacket(process.cwd(), runId, {
              channel: options.channel,
              strict: options.strict
            });
        console.log(
          options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2)
        );
      }
    );
}
