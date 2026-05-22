import { refreshLedgerAfterOperation } from "../ledger/events.js";
import { verifyRun } from "../orchestrator/verify.js";
export function registerVerifyCommand(program) {
    program
        .command("verify")
        .argument("<run-id>", "run id")
        .option("--confirm <confirmation>", "exact confirmation string")
        .option("--all", "run all available verification commands")
        .option("--test", "run test script")
        .option("--build", "run build script")
        .option("--lint", "run lint script")
        .option("--typecheck", "run typecheck script")
        .option("--timeout-ms <number>", "timeout per command")
        .option("--json", "print JSON")
        .description("Run explicit approved project verification")
        .action(async (runId, options) => {
        if (!options.confirm) {
            console.log(`Available verification commands require confirmation: VERIFY ${runId}`);
            return;
        }
        const names = options.all
            ? undefined
            : [
                options.typecheck ? "typecheck" : undefined,
                options.lint ? "lint" : undefined,
                options.test ? "test" : undefined,
                options.build ? "build" : undefined
            ].filter(Boolean);
        const result = await verifyRun(process.cwd(), runId, {
            confirm: options.confirm,
            names,
            timeoutMs: options.timeoutMs ? Number.parseInt(options.timeoutMs, 10) : undefined
        });
        await refreshLedgerAfterOperation(process.cwd(), runId);
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : `Verification ${result.status}: ${result.commands.map((command) => `${command.name}:${command.status}`).join(", ")}`);
    });
}
//# sourceMappingURL=verify.js.map