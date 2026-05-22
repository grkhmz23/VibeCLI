import { createBetaRcReport } from "../beta/rc-report.js";
export function registerBetaRcCommand(program) {
    program
        .command("beta-rc")
        .option("--channel <channel>", "private-beta, closed-beta, or public-beta")
        .option("--strict", "strict RC gates")
        .option("--json", "print JSON")
        .description("Generate local beta release-candidate gate report")
        .action(async (options) => {
        const result = await createBetaRcReport(process.cwd(), {
            channel: options.channel,
            strict: options.strict
        });
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : `Beta RC: ${result.verdict} (${result.blockers.length} blockers, ${result.warnings.length} warnings)`);
    });
}
//# sourceMappingURL=beta-rc.js.map