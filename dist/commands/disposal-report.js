import { createDisposalReport } from "../evidence-disposal/cross-run.js";
export function registerDisposalReportCommand(program) {
    program
        .command("disposal-report")
        .description("Create cross-run local disposal planning report")
        .option("--deep", "perform deeper safe metadata scan")
        .option("--json", "print JSON")
        .action(async (options) => {
        const result = await createDisposalReport(process.cwd(), { deep: options.deep });
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : `Disposal report: ${result.summary.totalRuns} runs, ${result.summary.eligibleRuns} eligible`);
    });
}
//# sourceMappingURL=disposal-report.js.map