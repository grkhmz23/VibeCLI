import { runSecurityRedteam } from "../dogfood/redteam.js";
export function registerSecurityRedteamCommand(program) {
    program
        .command("security-redteam")
        .option("--json", "print JSON")
        .description("Run local safety red-team harness")
        .action(async (options) => {
        const result = await runSecurityRedteam(process.cwd());
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : `Security red-team: ${result.summary.passed} passed, ${result.summary.failed} failed`);
    });
}
//# sourceMappingURL=security-redteam.js.map