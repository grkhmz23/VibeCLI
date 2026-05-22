import { branchRun } from "../git-lifecycle/branch.js";
export function registerBranchCommand(program) {
    program
        .command("branch")
        .argument("<run-id>", "run id")
        .option("--name <name>", "custom branch name")
        .option("--create", "create branch")
        .option("--confirm <confirm>", "exact confirmation")
        .option("--allow-dirty", "allow dirty working tree")
        .option("--switch-existing", "switch to existing branch")
        .option("--json", "print JSON")
        .description("Preview or create a safe branch for a run")
        .action(async (runId, options) => {
        const result = await branchRun(process.cwd(), runId, options);
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : [
                `Branch: ${result.branch}`,
                `Mode: ${result.mode}`,
                `Current: ${result.currentBranch ?? "unknown"}`,
                `Warnings: ${result.warnings.join("; ") || "none"}`,
                `Create: vibe branch ${runId} --create --confirm "CREATE BRANCH ${runId}"`
            ].join("\n"));
    });
}
//# sourceMappingURL=branch.js.map