import { scannerReadiness } from "../dogfood/scanner-readiness.js";
export function registerScannerCheckCommand(program) {
    program
        .command("scanner-check")
        .option("--run-safe", "run safe local version/help commands")
        .option("--strict", "evaluate scanner gate policy")
        .option("--install-guide", "write scanner install guidance without installing")
        .option("--confirm <value>", "exact confirmation")
        .option("--json", "print JSON")
        .description("Check external scanner availability without network scans")
        .action(async (options) => {
        const result = await scannerReadiness(process.cwd(), {
            runSafe: options.runSafe,
            confirm: options.confirm,
            strict: options.strict,
            installGuide: options.installGuide
        });
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : `Scanner readiness: ${result.summary.available} available, ${result.summary.missing} missing`);
    });
}
//# sourceMappingURL=scanner-check.js.map