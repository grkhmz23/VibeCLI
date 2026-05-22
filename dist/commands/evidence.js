import { createEvidenceBundle, verifyEvidenceBundle } from "../provenance/evidence-bundle.js";
export function registerEvidenceCommand(program) {
    program
        .command("evidence")
        .argument("<run-id>", "run id")
        .option("--sign", "sign evidence bundle")
        .option("--confirm <confirm>", "exact confirmation")
        .option("--verify", "verify evidence bundle")
        .option("--json", "print JSON")
        .description("Create or verify a redacted release evidence bundle")
        .action(async (runId, options) => {
        const result = options.verify
            ? await verifyEvidenceBundle(process.cwd(), runId)
            : await createEvidenceBundle(process.cwd(), runId, {
                sign: options.sign,
                confirm: options.confirm
            });
        console.log(options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2));
        if (options.verify && "ok" in result && !result.ok)
            process.exitCode = 1;
    });
}
//# sourceMappingURL=evidence.js.map