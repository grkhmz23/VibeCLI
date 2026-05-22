import { addReleaseApproval } from "../release/approval.js";
export function registerReleaseApprovalCommand(program) {
    program
        .command("release-approval")
        .argument("<run-id>", "run id")
        .option("--decision <decision>", "approved, rejected, or needs_changes")
        .option("--reviewer <name>", "reviewer")
        .option("--note <note>", "approval note")
        .option("--confirm <confirm>", "exact confirmation")
        .description("Show or add release approval notes")
        .action(async (runId, options) => {
        console.log(JSON.stringify(await addReleaseApproval(process.cwd(), runId, {
            decision: options.decision,
            reviewer: options.reviewer,
            note: options.note,
            confirm: options.confirm
        }), null, 2));
    });
}
//# sourceMappingURL=release-approval.js.map