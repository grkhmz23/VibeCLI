import type { Command } from "commander";
import { createOrgAuditReport } from "../org/audit-report.js";

export function registerOrgReportCommand(program: Command): void {
  program
    .command("org-report")
    .argument("<run-id>", "run id")
    .option("--json", "print JSON")
    .action(async (runId: string, options: { json?: boolean }) => {
      const result = await createOrgAuditReport(process.cwd(), runId);
      console.log(options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2));
    });
}
