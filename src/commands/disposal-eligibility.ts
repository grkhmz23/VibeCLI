import type { Command } from "commander";
import { evaluateDisposalEligibility } from "../evidence-disposal/expiry.js";
import { createDisposalReport } from "../evidence-disposal/cross-run.js";

export function registerDisposalEligibilityCommand(program: Command): void {
  program
    .command("disposal-eligibility")
    .argument("[run-id]", "run id")
    .description("Evaluate local evidence disposal eligibility")
    .option("--all", "summarize all runs")
    .option("--policy <name>", "retention policy name")
    .option("--json", "print JSON")
    .action(
      async (
        runId: string | undefined,
        options: { all?: boolean; policy?: string; json?: boolean }
      ) => {
        if (options.all) {
          const report = await createDisposalReport(process.cwd());
          console.log(
            options.json
              ? JSON.stringify(report, null, 2)
              : `Disposal eligibility index: ${report.summary.totalRuns} runs`
          );
          return;
        }
        if (!runId) throw new Error("Run id is required unless --all is used.");
        const result = await evaluateDisposalEligibility(process.cwd(), runId, {
          policy: options.policy
        });
        console.log(
          options.json
            ? JSON.stringify(result, null, 2)
            : `Disposal eligibility ${result.eligible ? "ELIGIBLE" : "BLOCKED"}: ${result.blockingReasons.join("; ") || "no blockers"}`
        );
      }
    );
}
