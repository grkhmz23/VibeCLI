import type { Command } from "commander";
import {
  generateEvidenceInventory,
  summarizeAllInventories
} from "../evidence-lifecycle/inventory.js";

export function registerEvidenceInventoryCommand(program: Command): void {
  program
    .command("evidence-inventory")
    .argument("[run-id]", "run id")
    .option("--all", "summarize inventory status for all runs")
    .option("--deep", "sample larger files when safe")
    .option("--json", "print JSON")
    .description("Create a local redacted run evidence inventory")
    .action(
      async (
        runId: string | undefined,
        options: { all?: boolean; deep?: boolean; json?: boolean }
      ) => {
        if (options.all) {
          const result = await summarizeAllInventories(process.cwd());
          console.log(
            options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2)
          );
          return;
        }
        if (!runId) throw new Error("Usage: vibe evidence-inventory <run-id>");
        const result = await generateEvidenceInventory(process.cwd(), runId, {
          deep: options.deep
        });
        console.log(
          options.json
            ? JSON.stringify(result, null, 2)
            : `Evidence inventory generated for ${runId}: ${result.summary.totalFiles} files, ${result.summary.excludedFiles} excluded`
        );
      }
    );
}
