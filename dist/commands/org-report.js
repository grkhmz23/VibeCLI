import { createOrgAuditReport } from "../org/audit-report.js";
export function registerOrgReportCommand(program) {
    program
        .command("org-report")
        .argument("<run-id>", "run id")
        .option("--json", "print JSON")
        .action(async (runId, options) => {
        const result = await createOrgAuditReport(process.cwd(), runId);
        console.log(options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2));
    });
}
//# sourceMappingURL=org-report.js.map