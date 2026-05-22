import { createCompactEvidenceBundle, createCompactionReport, verifyCompactEvidenceBundle } from "../evidence-lifecycle/compaction.js";
export function registerEvidenceCompactCommand(program) {
    program
        .command("evidence-compact")
        .argument("<run-id>", "run id")
        .option("--bundle", "create compact summary bundle")
        .option("--confirm <confirm>", "exact confirmation")
        .option("--verify", "verify compact summary bundle")
        .option("--json", "print JSON")
        .description("Generate evidence compaction reports and compact summary bundles")
        .action(async (runId, options) => {
        const result = options.verify
            ? await verifyCompactEvidenceBundle(process.cwd(), runId)
            : options.bundle
                ? await createCompactEvidenceBundle(process.cwd(), runId, {
                    confirm: options.confirm
                })
                : await createCompactionReport(process.cwd(), runId);
        console.log(options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2));
        if (options.verify && "ok" in result && !result.ok)
            process.exitCode = 1;
    });
}
//# sourceMappingURL=evidence-compact.js.map