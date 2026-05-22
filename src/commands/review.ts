import type { Command } from "commander";
import { formatReview, readPatchDiffs, reviewRun } from "../orchestrator/diff.js";
import { RunStore } from "../orchestrator/run-store.js";

export function registerReviewCommand(program: Command): void {
  program
    .command("review")
    .argument("<run-id>", "run id")
    .option("--json", "print JSON")
    .option("--diff", "print proposed diffs")
    .option("--summary", "print concise summary")
    .description("Review proposed patches and command recommendations")
    .action(
      async (runId: string, options: { json?: boolean; diff?: boolean; summary?: boolean }) => {
        if (options.diff) {
          console.log(await readPatchDiffs(new RunStore(process.cwd()), runId));
          return;
        }
        const summary = await reviewRun(process.cwd(), runId);
        console.log(
          options.json
            ? JSON.stringify(summary, null, 2)
            : `${formatReview(summary, Boolean(options.summary))}\nNext safe command: vibe approve ${runId}`
        );
      }
    );
}
