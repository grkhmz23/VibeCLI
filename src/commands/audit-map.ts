import type { Command } from "commander";
import { generateAuditEvidenceMap } from "../audit/evidence-mapper.js";

export function registerAuditMapCommand(program: Command): void {
  program
    .command("audit-map")
    .argument("<run-id>")
    .option("--schema <schema>", "audit schema")
    .option("--json", "print JSON")
    .description("Map run artifacts to an audit evidence schema")
    .action(async (runId: string, options: { schema?: string; json?: boolean }) => {
      const result = await generateAuditEvidenceMap(process.cwd(), runId, options);
      console.log(
        options.json
          ? JSON.stringify(result, null, 2)
          : `Audit evidence map generated for ${runId}: ${result.summary.satisfied}/${result.summary.totalControls} satisfied`
      );
    });
}
