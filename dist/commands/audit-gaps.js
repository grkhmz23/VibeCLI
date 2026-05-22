import { generateAuditGaps } from "../audit/gaps.js";
export function registerAuditGapsCommand(program) {
    program
        .command("audit-gaps")
        .argument("<run-id>")
        .option("--schema <schema>", "audit schema")
        .option("--json", "print JSON")
        .description("Generate prioritized audit evidence gap analysis")
        .action(async (runId, options) => {
        const result = await generateAuditGaps(process.cwd(), runId, options);
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : `Audit gaps: P0 ${result.summary.p0}, P1 ${result.summary.p1}, P2 ${result.summary.p2}, P3 ${result.summary.p3}`);
    });
}
//# sourceMappingURL=audit-gaps.js.map