import { createEvidenceExport, verifyEvidenceExport } from "../org/evidence-export-policy.js";
export function registerEvidenceExportCommand(program) {
    program
        .command("evidence-export")
        .argument("<run-id>", "run id")
        .option("--mode <mode>", "minimal, audit, or forensic-redacted")
        .option("--verify", "verify export")
        .option("--json", "print JSON")
        .action(async (runId, options) => {
        const result = options.verify
            ? await verifyEvidenceExport(process.cwd(), runId)
            : await createEvidenceExport(process.cwd(), runId, { mode: options.mode });
        console.log(options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2));
    });
}
//# sourceMappingURL=evidence-export.js.map