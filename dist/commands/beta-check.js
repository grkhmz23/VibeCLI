import { runBetaCheck } from "../dogfood/beta-readiness.js";
export function registerBetaCheckCommand(program) {
    program
        .command("beta-check")
        .option("--strict", "require all beta reports")
        .option("--json", "print JSON")
        .description("Aggregate local beta readiness")
        .action(async (options) => {
        const result = await runBetaCheck(process.cwd(), { strict: options.strict });
        console.log(options.json ? JSON.stringify(result, null, 2) : `Beta readiness: ${result.verdict}`);
    });
}
//# sourceMappingURL=beta-check.js.map