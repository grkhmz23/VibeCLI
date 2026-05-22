import type { Command } from "commander";
import { createHandoffBundle, buildHandoffSummary } from "../handoff/bundle.js";
import { generateReviewerChecklist } from "../handoff/reviewer-checklist.js";
import { RunStore } from "../orchestrator/run-store.js";

export function registerChecklistCommand(program: Command): void {
  program
    .command("checklist")
    .argument("<run-id>", "run id")
    .option("--json", "print JSON")
    .description("Generate policy-aware reviewer checklist")
    .action(async (runId: string, options: { json?: boolean }) => {
      await createHandoffBundle(process.cwd(), runId);
      const summary = await buildHandoffSummary(process.cwd(), runId);
      const checklist = generateReviewerChecklist(summary);
      await new RunStore(process.cwd()).writeTextArtifact(
        runId,
        "handoff/REVIEW_CHECKLIST.md",
        checklist
      );
      console.log(
        options.json
          ? JSON.stringify({ runId, path: `handoff/REVIEW_CHECKLIST.md` }, null, 2)
          : `Checklist refreshed for ${runId}`
      );
    });
}
