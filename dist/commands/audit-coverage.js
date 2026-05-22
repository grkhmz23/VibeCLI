import { generateAuditCoverage } from "../audit/coverage.js";
export function registerAuditCoverageCommand(program) {
    program
        .command("audit-coverage")
        .argument("<run-id>")
        .option("--schema <schema>", "audit schema")
        .option("--json", "print JSON")
        .description("Generate audit control coverage report")
        .action(async (runId, options) => {
        const result = await generateAuditCoverage(process.cwd(), runId, options);
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : `Audit coverage: ${result.coverage.percentSatisfied}% required controls satisfied`);
    });
}
//# sourceMappingURL=audit-coverage.js.map