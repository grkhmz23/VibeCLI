import { buildLifecycle } from "../git-lifecycle/lifecycle.js";
import { refreshLedgerAfterOperation } from "../ledger/events.js";
export function registerLifecycleCommand(program) {
    program
        .command("lifecycle")
        .argument("<run-id>", "run id")
        .option("--json", "print JSON")
        .option("--refresh", "refresh lifecycle")
        .description("Show repository lifecycle status")
        .action(async (runId, options) => {
        const result = await buildLifecycle(process.cwd(), runId);
        await refreshLedgerAfterOperation(process.cwd(), runId);
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : `Lifecycle ${runId}: branch=${result.branch.current ?? "unknown"} commit=${result.commit.status} pr=${result.github.prStatus ?? "not_started"} readiness=${result.readiness.verdict ?? "unknown"}`);
    });
}
//# sourceMappingURL=lifecycle.js.map