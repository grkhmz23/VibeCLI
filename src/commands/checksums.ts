import type { Command } from "commander";
import { createChecksums, verifyChecksums } from "../provenance/checksums.js";

export function registerChecksumsCommand(program: Command): void {
  program
    .command("checksums")
    .argument("<run-id>", "run id")
    .option("--verify", "verify checksum manifest")
    .option("--json", "print JSON")
    .description("Create or verify release-safe checksum manifests")
    .action(async (runId: string, options: { verify?: boolean; json?: boolean }) => {
      const result = options.verify
        ? await verifyChecksums(process.cwd(), runId)
        : await createChecksums(process.cwd(), runId);
      console.log(options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2));
      if (options.verify && "ok" in result && !result.ok) process.exitCode = 1;
    });
}
