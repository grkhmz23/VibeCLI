import type { Command } from "commander";
import { createDisposalAttestation } from "../evidence-disposal/attestation.js";

export function registerDisposalAttestationCommand(program: Command): void {
  program
    .command("disposal-attestation")
    .argument("<run-id>", "run id")
    .description("Create local disposal candidate attestation")
    .option("--sign", "sign attestation")
    .option("--confirm <confirm>", "exact confirmation")
    .option("--json", "print JSON")
    .action(
      async (runId: string, options: { sign?: boolean; confirm?: string; json?: boolean }) => {
        const result = await createDisposalAttestation(process.cwd(), runId, options);
        console.log(
          options.json
            ? JSON.stringify(result, null, 2)
            : `Disposal attestation ${options.sign ? "signed" : "generated"}: ${result.candidateCount} candidates`
        );
      }
    );
}
