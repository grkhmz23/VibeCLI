import { createEvidenceLifecycleIndex, createEvidenceLifecycleReport } from "../evidence-lifecycle/lifecycle-report.js";
export function registerEvidenceLifecycleCommand(program) {
    program
        .command("evidence-lifecycle")
        .argument("[run-id]", "run id")
        .option("--all", "generate cross-run lifecycle index")
        .option("--json", "print JSON")
        .description("Generate a run evidence lifecycle status report")
        .action(async (runId, options) => {
        const result = options.all
            ? await createEvidenceLifecycleIndex(process.cwd())
            : runId
                ? await createEvidenceLifecycleReport(process.cwd(), runId)
                : undefined;
        if (!result)
            throw new Error("Usage: vibe evidence-lifecycle <run-id> | --all");
        console.log(options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2));
    });
}
//# sourceMappingURL=evidence-lifecycle.js.map