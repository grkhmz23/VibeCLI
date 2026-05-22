import type { Command } from "commander";
import { createAttestationExport } from "../remote-attestation/export-pack.js";
import { readRemoteSubmissionReceipt } from "../remote-attestation/receipt.js";
import { submitAttestation } from "../remote-attestation/submit.js";

export function registerAttestationCommand(program: Command): void {
  const command = program.command("attestation").description("Manage attestation exports");
  command
    .command("export")
    .argument("<run-id>", "run id")
    .option("--json", "print JSON")
    .option("--refresh", "refresh export")
    .action(async (runId: string, options: { json?: boolean; refresh?: boolean }) => {
      const result = await createAttestationExport(process.cwd(), runId);
      console.log(options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2));
      void options.refresh;
    });
  command
    .command("submit")
    .argument("<run-id>", "run id")
    .requiredOption("--target <name>", "target name")
    .option("--confirm <confirm>", "exact confirmation")
    .option("--dry-run", "validate without submitting")
    .option("--allow-config-disabled", "allow disabled remote submission config")
    .option("--allow-ledger-warning", "allow ledger warning")
    .action(
      async (
        runId: string,
        options: {
          target: string;
          confirm?: string;
          dryRun?: boolean;
          allowConfigDisabled?: boolean;
          allowLedgerWarning?: boolean;
        }
      ) => {
        const result = await submitAttestation(process.cwd(), runId, options);
        console.log(JSON.stringify(result, null, 2));
      }
    );
  command
    .command("receipt")
    .argument("<run-id>", "run id")
    .option("--json", "print JSON")
    .action(async (runId: string, options: { json?: boolean }) => {
      const receipt = await readRemoteSubmissionReceipt(process.cwd(), runId);
      console.log(
        options.json ? JSON.stringify(receipt, null, 2) : JSON.stringify(receipt, null, 2)
      );
    });
}
