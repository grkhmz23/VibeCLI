import type { Command } from "commander";
import { ingestCiFile, ingestGithubCi, showOrCreateLocalCiStatus } from "../release/ci.js";

export function registerCiCommand(program: Command): void {
  program
    .command("ci")
    .argument("<run-id>", "run id")
    .option("--github", "ingest read-only GitHub Actions status with gh")
    .option("--confirm <confirm>", "exact confirmation")
    .option("--file <path>", "local CI status JSON")
    .description("Show or ingest CI status")
    .action(
      async (runId: string, options: { github?: boolean; confirm?: string; file?: string }) => {
        const result = options.github
          ? await ingestGithubCi(process.cwd(), runId, options.confirm)
          : options.file
            ? await ingestCiFile(process.cwd(), runId, options.file)
            : await showOrCreateLocalCiStatus(process.cwd(), runId);
        console.log(JSON.stringify(result, null, 2));
      }
    );
}
