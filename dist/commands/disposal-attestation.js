import { createDisposalAttestation } from "../evidence-disposal/attestation.js";
export function registerDisposalAttestationCommand(program) {
    program
        .command("disposal-attestation")
        .argument("<run-id>", "run id")
        .description("Create local disposal candidate attestation")
        .option("--sign", "sign attestation")
        .option("--confirm <confirm>", "exact confirmation")
        .option("--json", "print JSON")
        .action(async (runId, options) => {
        const result = await createDisposalAttestation(process.cwd(), runId, options);
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : `Disposal attestation ${options.sign ? "signed" : "generated"}: ${result.candidateCount} candidates`);
    });
}
//# sourceMappingURL=disposal-attestation.js.map