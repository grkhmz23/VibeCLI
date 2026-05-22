import { createAuditExport, verifyAuditExport } from "../audit/export.js";
export function registerAuditExportCommand(program) {
    program
        .command("audit-export")
        .argument("<run-id>")
        .option("--schema <schema>", "audit schema")
        .option("--format <format>", "json, markdown, or csv")
        .option("--sign", "sign audit export")
        .option("--confirm <confirm>", "exact confirmation")
        .option("--verify", "verify audit export")
        .option("--json", "print JSON")
        .description("Create or verify a local audit report export")
        .action(async (runId, options) => {
        if (options.verify) {
            const result = await verifyAuditExport(process.cwd(), runId);
            console.log(options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2));
            if (!result.ok)
                process.exitCode = 1;
            return;
        }
        const result = await createAuditExport(process.cwd(), runId, options);
        console.log(options.json ? JSON.stringify(result, null, 2) : `Audit export generated for ${runId}`);
    });
}
//# sourceMappingURL=audit-export.js.map