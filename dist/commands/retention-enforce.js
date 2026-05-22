import { previewRetentionEnforcement } from "../evidence-lifecycle/retention-enforcement.js";
export function registerRetentionEnforceCommand(program) {
    program
        .command("retention-enforce")
        .argument("<run-id>", "run id")
        .option("--policy <policy>", "retention policy")
        .option("--json", "print JSON")
        .description("Preview local retention enforcement without deleting evidence")
        .action(async (runId, options) => {
        const result = await previewRetentionEnforcement(process.cwd(), runId, {
            policy: options.policy
        });
        console.log(options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2));
    });
}
//# sourceMappingURL=retention-enforce.js.map