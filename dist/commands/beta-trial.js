import { createBetaTrialPack, listBetaTrials, showBetaTrial } from "../beta/trial-pack.js";
export function registerBetaTrialCommand(program) {
    const command = program
        .command("beta-trial")
        .description("Create and inspect local beta trial packs");
    command
        .command("create")
        .option("--target <target>", "solo-developer, startup-team, agency, security-reviewer, custom")
        .option("--json", "print JSON")
        .action(async (options) => {
        const result = await createBetaTrialPack(process.cwd(), options.target);
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : `Beta trial created: ${result.trialId} (${result.targetUser})`);
    });
    command
        .command("list")
        .option("--json", "print JSON")
        .action(async (options) => {
        const result = await listBetaTrials(process.cwd());
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : result.map((item) => item.trialId).join("\n"));
    });
    command
        .command("show <trial-id>")
        .option("--json", "print JSON")
        .action(async (trialId, options) => {
        const result = await showBetaTrial(process.cwd(), trialId);
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : `Beta trial ${result.trialId}: ${result.targetUser}`);
    });
}
//# sourceMappingURL=beta-trial.js.map