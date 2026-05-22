import type { Command } from "commander";
import { createRetentionPlan } from "../org/retention.js";

export function registerRetentionCommand(program: Command): void {
  program
    .command("retention")
    .argument("<run-id>", "run id")
    .option("--policy <policy>", "retention policy")
    .option("--mark", "write retention marker")
    .option("--purge-preview", "show purge preview only")
    .option("--confirm <confirm>", "exact confirmation")
    .option("--json", "print JSON")
    .action(
      async (
        runId: string,
        options: {
          policy?: string;
          mark?: boolean;
          purgePreview?: boolean;
          confirm?: string;
          json?: boolean;
        }
      ) => {
        const result = await createRetentionPlan(process.cwd(), runId, options);
        console.log(
          options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2)
        );
      }
    );
}
