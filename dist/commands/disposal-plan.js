import { createDisposalPlan } from "../evidence-disposal/plan.js";
export function registerDisposalPlanCommand(program) {
    program
        .command("disposal-plan")
        .argument("<run-id>", "run id")
        .description("Create local evidence disposal plan")
        .option("--force-preview", "show blocked plan details without deleting")
        .option("--json", "print JSON")
        .action(async (runId, options) => {
        const result = await createDisposalPlan(process.cwd(), runId, {
            forcePreview: options.forcePreview
        });
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : `Disposal plan ${result.status}: ${result.estimatedFilesToDelete} files. Confirm with: ${result.exactConfirmation}`);
    });
}
//# sourceMappingURL=disposal-plan.js.map