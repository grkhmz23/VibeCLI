import { acceptBetaWarning, collectBetaWarnings } from "../beta/warnings.js";
export function registerBetaWarningsCommand(program) {
    const command = program
        .command("beta-warnings")
        .description("List or triage local beta warnings");
    command.option("--json", "print JSON").action(async (options) => {
        const result = await collectBetaWarnings(process.cwd());
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : `Beta warnings: ${result.summary.open} open, ${result.summary.accepted} accepted, ${result.summary.blockingOpen} blocking`);
    });
    command
        .command("accept <warning-id>")
        .requiredOption("--by <name>", "reviewer")
        .requiredOption("--reason <reason>", "acceptance reason")
        .option("--confirm <value>", "exact confirmation")
        .option("--strict", "enforce strict warning acceptance rules")
        .option("--json", "print JSON")
        .action(async (warningId, options) => {
        const result = await acceptBetaWarning(process.cwd(), warningId, {
            by: options.by,
            reason: options.reason,
            confirm: options.confirm,
            strict: options.strict
        });
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : `Accepted ${warningId}. Open warnings: ${result.summary.open}`);
    });
    command
        .command("resolve <warning-id>")
        .requiredOption("--by <name>", "reviewer")
        .requiredOption("--reason <reason>", "resolution reason")
        .option("--confirm <value>", "exact confirmation")
        .option("--json", "print JSON")
        .action(async (warningId, options) => {
        const result = await acceptBetaWarning(process.cwd(), warningId, {
            by: options.by,
            reason: options.reason,
            confirm: options.confirm,
            resolve: true
        });
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : `Resolved ${warningId}. Open warnings: ${result.summary.open}`);
    });
}
//# sourceMappingURL=beta-warnings.js.map