import { createBetaBacklog } from "../dogfood/backlog.js";
export function registerBetaBacklogCommand(program) {
    program
        .command("beta-backlog")
        .option("--json", "print JSON")
        .description("Create local beta blocker backlog")
        .action(async (options) => {
        const result = await createBetaBacklog(process.cwd());
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : `Beta backlog: ${result.summary.blockingBeta} blocking items`);
    });
}
//# sourceMappingURL=beta-backlog.js.map