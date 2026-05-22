import type { Command } from "commander";
import { createEvidenceReport } from "../evidence-lifecycle/cross-run-report.js";

export function registerEvidenceReportCommand(program: Command): void {
  program
    .command("evidence-report")
    .option("--deep", "perform deeper safe metadata scan")
    .option("--policy <policy>", "filter by retention policy")
    .option("--json", "print JSON")
    .description("Generate a cross-run evidence lifecycle report")
    .action(async (options: { deep?: boolean; policy?: string; json?: boolean }) => {
      const result = await createEvidenceReport(process.cwd(), options);
      console.log(options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2));
    });
}
