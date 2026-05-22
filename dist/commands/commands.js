import { executeApprovedCommands, readCommandReview } from "../orchestrator/commands.js";
export function registerCommandsCommand(program) {
    program
        .command("commands")
        .argument("<run-id>", "run id")
        .option("--json", "print JSON")
        .option("--execute-approved", "execute only commands classified as allowed")
        .option("--confirm <confirmation>", "exact confirmation string")
        .description("Review or execute approved command recommendations")
        .action(async (runId, options) => {
        if (options.executeApproved) {
            const result = await executeApprovedCommands(process.cwd(), runId, {
                confirm: options.confirm
            });
            console.log(options.json
                ? JSON.stringify(result, null, 2)
                : `Executed command review: ${result.commands.length} entries`);
            return;
        }
        const review = await readCommandReview(process.cwd(), runId);
        console.log(options.json ? JSON.stringify(review, null, 2) : JSON.stringify(review, null, 2));
    });
}
//# sourceMappingURL=commands.js.map