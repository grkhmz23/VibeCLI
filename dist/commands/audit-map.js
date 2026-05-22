import { generateAuditEvidenceMap } from "../audit/evidence-mapper.js";
export function registerAuditMapCommand(program) {
    program
        .command("audit-map")
        .argument("<run-id>")
        .option("--schema <schema>", "audit schema")
        .option("--json", "print JSON")
        .description("Map run artifacts to an audit evidence schema")
        .action(async (runId, options) => {
        const result = await generateAuditEvidenceMap(process.cwd(), runId, options);
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : `Audit evidence map generated for ${runId}: ${result.summary.satisfied}/${result.summary.totalControls} satisfied`);
    });
}
//# sourceMappingURL=audit-map.js.map