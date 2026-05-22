import { runDisposalPrecheck } from "../evidence-disposal/predelete.js";
export function registerDisposalPrecheckCommand(program) {
    program
        .command("disposal-precheck")
        .argument("<run-id>", "run id")
        .description("Run local pre-delete checks")
        .option("--json", "print JSON")
        .action(async (runId, options) => {
        const result = await runDisposalPrecheck(process.cwd(), runId);
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : `Disposal precheck ${result.ok ? "PASS" : "FAIL"}: ${result.checks.length} checks`);
        if (!result.ok)
            process.exitCode = 1;
    });
}
//# sourceMappingURL=disposal-precheck.js.map