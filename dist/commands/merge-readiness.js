import { evaluateMergeReadiness } from "../git-lifecycle/merge-readiness.js";
export function registerMergeReadinessCommand(program) {
    const action = async (runId, options) => {
        const result = await evaluateMergeReadiness(process.cwd(), runId, options);
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : `Merge readiness ${runId}: ${result.verdict}\nBlocked: ${result.blockingReasons.join("; ") || "none"}`);
    };
    program
        .command("merge-readiness")
        .argument("<run-id>", "run id")
        .option("--github", "include read-only GitHub PR state")
        .option("--pr <pr>", "PR number or URL")
        .option("--confirm <confirm>", "exact confirmation")
        .option("--json", "print JSON")
        .description("Evaluate policy-aware merge readiness without merging")
        .action(action);
    program
        .command("merge-check")
        .argument("<run-id>", "run id")
        .option("--github", "include read-only GitHub PR state")
        .option("--pr <pr>", "PR number or URL")
        .option("--confirm <confirm>", "exact confirmation")
        .option("--json", "print JSON")
        .description("Alias for merge-readiness")
        .action(action);
}
//# sourceMappingURL=merge-readiness.js.map