import { createComplianceBundle, verifyComplianceBundle } from "../audit/compliance-bundle.js";
export function registerComplianceBundleCommand(program) {
    program
        .command("compliance-bundle")
        .argument("<run-id>")
        .option("--schema <schema>", "audit schema")
        .option("--minimal", "include summary artifacts only")
        .option("--sign", "sign compliance bundle")
        .option("--confirm <confirm>", "exact confirmation")
        .option("--verify", "verify compliance bundle")
        .option("--json", "print JSON")
        .description("Create or verify a read-only compliance check bundle")
        .action(async (runId, options) => {
        if (options.verify) {
            const result = await verifyComplianceBundle(process.cwd(), runId);
            console.log(options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2));
            if (!result.ok)
                process.exitCode = 1;
            return;
        }
        const result = await createComplianceBundle(process.cwd(), runId, options);
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : `Compliance check bundle generated for ${runId}`);
    });
}
//# sourceMappingURL=compliance-bundle.js.map