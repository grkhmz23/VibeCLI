import type { Command } from "commander";
import { createBetaBacklog } from "../dogfood/backlog.js";

export function registerBetaBacklogCommand(program: Command): void {
  program
    .command("beta-backlog")
    .option("--json", "print JSON")
    .description("Create local beta blocker backlog")
    .action(async (options: { json?: boolean }) => {
      const result = await createBetaBacklog(process.cwd());
      console.log(
        options.json
          ? JSON.stringify(result, null, 2)
          : `Beta backlog: ${result.summary.blockingBeta} blocking items`
      );
    });
}
