import { runPerfCheck } from "../dogfood/performance.js";
export function registerPerfCheckCommand(program) {
    program
        .command("perf-check")
        .option("--json", "print JSON")
        .description("Measure safe local command performance and artifact sizes")
        .action(async (options) => {
        const result = await runPerfCheck(process.cwd());
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : `Perf check: ${result.summary.warnings} warnings, ${result.summary.failures} failures`);
    });
}
//# sourceMappingURL=perf-check.js.map