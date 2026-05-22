import { runPackageCheck } from "../dogfood/package-check.js";
export function registerPackageCheckCommand(program) {
    program
        .command("package-check")
        .option("--json", "print JSON")
        .description("Check package/install readiness without publishing")
        .action(async (options) => {
        const result = await runPackageCheck(process.cwd());
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : `Package check: ${result.summary.passed} passed, ${result.summary.failed} failed`);
    });
}
//# sourceMappingURL=package-check.js.map