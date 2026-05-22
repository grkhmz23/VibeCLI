import type { Command } from "commander";
import { createEvidenceArchive, previewEvidenceArchive } from "../evidence-lifecycle/archive.js";
import { verifyEvidenceArchive } from "../evidence-lifecycle/archive-verify.js";
import type { EvidenceArchiveMode } from "../evidence-lifecycle/types.js";

export function registerEvidenceArchiveCommand(program: Command): void {
  program
    .command("evidence-archive")
    .argument("<run-id>", "run id")
    .option("--create", "create local archive")
    .option("--mode <mode>", "minimal, audit, or forensic-redacted")
    .option("--sign", "sign archive manifest")
    .option("--confirm <confirm>", "exact confirmation")
    .option("--allow-ledger-warning", "allow archive when run ledger does not verify")
    .option("--allow-missing-retention", "allow archive when retention plan is missing")
    .option("--verify", "verify archive")
    .option("--json", "print JSON")
    .description("Preview, create, or verify a local redacted evidence archive")
    .action(
      async (
        runId: string,
        options: {
          create?: boolean;
          mode?: EvidenceArchiveMode | "forensic-redacted";
          sign?: boolean;
          confirm?: string;
          allowLedgerWarning?: boolean;
          allowMissingRetention?: boolean;
          verify?: boolean;
          json?: boolean;
        }
      ) => {
        const result = options.verify
          ? await verifyEvidenceArchive(process.cwd(), runId)
          : options.create || options.sign
            ? await createEvidenceArchive(process.cwd(), runId, options)
            : await previewEvidenceArchive(process.cwd(), runId, options);
        console.log(
          options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2)
        );
        if (options.verify && "ok" in result && !result.ok) process.exitCode = 1;
      }
    );
}
