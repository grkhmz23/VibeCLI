import type { Command } from "commander";
import { ingestGithubFeedback } from "../reviewer-feedback/github.js";
import { ingestLocalFeedback } from "../reviewer-feedback/local.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists, readJson } from "../utils/fs.js";
import type { ReviewerFeedback } from "../reviewer-feedback/types.js";

export function registerFeedbackCommand(program: Command): void {
  program
    .command("feedback")
    .argument("<run-id>", "run id")
    .option("--github", "ingest feedback from GitHub with gh")
    .option("--pr <pr>", "PR number or URL")
    .option("--confirm <confirm>", "exact confirmation")
    .option("--file <path>", "local reviewer feedback file")
    .option("--json", "print JSON")
    .description("Ingest or show reviewer feedback for a run")
    .action(
      async (
        runId: string,
        options: {
          github?: boolean;
          pr?: string;
          confirm?: string;
          file?: string;
          json?: boolean;
        }
      ) => {
        const store = new RunStore(process.cwd());
        const result = options.github
          ? await ingestGithubFeedback(process.cwd(), runId, options.pr ?? "", options.confirm)
          : options.file
            ? await ingestLocalFeedback(process.cwd(), runId, options.file)
            : pathExists(`${store.runPath(runId)}/reviewer-feedback.json`)
              ? await readJson<ReviewerFeedback>(`${store.runPath(runId)}/reviewer-feedback.json`)
              : {
                  runId,
                  createdAt: new Date().toISOString(),
                  source: "local" as const,
                  pr: null,
                  reviewDecision: null,
                  comments: [],
                  checks: [],
                  summary: {
                    blockingComments: 0,
                    changeRequests: 0,
                    failedChecks: 0,
                    pendingChecks: 0
                  },
                  nextActions: [`vibe repair ${runId} --plan`]
                };
        console.log(
          options.json
            ? JSON.stringify(result, null, 2)
            : `Feedback ${runId}: comments=${result.comments.length} failedChecks=${result.summary.failedChecks}`
        );
      }
    );
}
