import type { Command } from "commander";
import { createAuditorHandoff, verifyAuditorHandoff } from "../audit/auditor-handoff.js";

export function registerAuditorHandoffCommand(program: Command): void {
  program
    .command("auditor-handoff")
    .argument("<run-id>")
    .option("--schema <schema>", "audit schema")
    .option("--minimal", "include concise bundle")
    .option("--verify", "verify auditor handoff")
    .option("--json", "print JSON")
    .description("Create or verify an auditor-facing handoff bundle")
    .action(
      async (
        runId: string,
        options: { schema?: string; minimal?: boolean; verify?: boolean; json?: boolean }
      ) => {
        if (options.verify) {
          const result = await verifyAuditorHandoff(process.cwd(), runId);
          console.log(
            options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2)
          );
          if (!result.ok) process.exitCode = 1;
          return;
        }
        const result = await createAuditorHandoff(process.cwd(), runId, options);
        console.log(
          options.json ? JSON.stringify(result, null, 2) : `Auditor handoff generated for ${runId}`
        );
      }
    );
}
