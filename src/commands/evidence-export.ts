import type { Command } from "commander";
import { createEvidenceExport, verifyEvidenceExport } from "../org/evidence-export-policy.js";

export function registerEvidenceExportCommand(program: Command): void {
  program
    .command("evidence-export")
    .argument("<run-id>", "run id")
    .option("--mode <mode>", "minimal, audit, or forensic-redacted")
    .option("--verify", "verify export")
    .option("--json", "print JSON")
    .action(
      async (
        runId: string,
        options: {
          mode?: "minimal" | "audit" | "forensic-redacted" | "forensic_redacted";
          verify?: boolean;
          json?: boolean;
        }
      ) => {
        const result = options.verify
          ? await verifyEvidenceExport(process.cwd(), runId)
          : await createEvidenceExport(process.cwd(), runId, { mode: options.mode });
        console.log(
          options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2)
        );
      }
    );
}
