import type { Command } from "commander";
import { generateAuditCoverage } from "../audit/coverage.js";

export function registerAuditCoverageCommand(program: Command): void {
  program
    .command("audit-coverage")
    .argument("<run-id>")
    .option("--schema <schema>", "audit schema")
    .option("--json", "print JSON")
    .description("Generate audit control coverage report")
    .action(async (runId: string, options: { schema?: string; json?: boolean }) => {
      const result = await generateAuditCoverage(process.cwd(), runId, options);
      console.log(
        options.json
          ? JSON.stringify(result, null, 2)
          : `Audit coverage: ${result.coverage.percentSatisfied}% required controls satisfied`
      );
    });
}
