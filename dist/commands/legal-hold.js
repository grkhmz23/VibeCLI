import { enableLegalHold, legalHoldStatus, releaseLegalHold } from "../evidence-lifecycle/legal-hold.js";
export function registerLegalHoldCommand(program) {
    program
        .command("legal-hold")
        .argument("<run-id>", "run id")
        .option("--enable", "enable legal hold metadata")
        .option("--release", "release legal hold metadata")
        .option("--reason <reason>", "reason")
        .option("--by <name>", "actor name")
        .option("--confirm <confirm>", "exact confirmation")
        .option("--json", "print JSON")
        .description("Show, enable, or release local legal hold metadata")
        .action(async (runId, options) => {
        const result = options.enable
            ? await enableLegalHold(process.cwd(), runId, options)
            : options.release
                ? await releaseLegalHold(process.cwd(), runId, options)
                : await legalHoldStatus(process.cwd(), runId);
        console.log(options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2));
    });
}
//# sourceMappingURL=legal-hold.js.map