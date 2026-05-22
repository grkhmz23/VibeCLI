import type { Command } from "commander";
import { buildDisposalCandidates } from "../evidence-disposal/candidates.js";

export function registerDisposalCandidatesCommand(program: Command): void {
  program
    .command("disposal-candidates")
    .argument("<run-id>", "run id")
    .description("Build conservative local evidence disposal candidates")
    .option("--json", "print JSON")
    .action(async (runId: string, options: { json?: boolean }) => {
      const result = await buildDisposalCandidates(process.cwd(), runId);
      console.log(
        options.json
          ? JSON.stringify(result, null, 2)
          : `Disposal candidates: ${result.summary.candidateFiles} files, ${result.summary.candidateBytes} bytes`
      );
    });
}
