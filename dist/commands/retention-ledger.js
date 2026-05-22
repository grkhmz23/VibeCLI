import { recordManualRetentionEvent, retentionLedgerSummary } from "../evidence-lifecycle/retention-ledger.js";
import { verifyRetentionLedger } from "../evidence-lifecycle/retention-ledger-verify.js";
export function registerRetentionLedgerCommand(program) {
    program
        .command("retention-ledger")
        .argument("[run-id]", "run id")
        .option("--verify", "verify retention ledger")
        .option("--record", "record a manual retention ledger event")
        .option("--event <event>", "retention event type")
        .option("--summary <summary>", "event summary")
        .option("--confirm <confirm>", "exact confirmation")
        .option("--json", "print JSON")
        .description("Show, verify, or record local retention ledger events")
        .action(async (runId, options) => {
        if (options.record) {
            if (!runId)
                throw new Error("Manual retention ledger record requires a run id.");
            const result = await recordManualRetentionEvent(process.cwd(), runId, {
                event: options.event ?? "retention_previewed",
                summary: options.summary ?? "",
                confirm: options.confirm
            });
            console.log(options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2));
            return;
        }
        if (options.verify) {
            const result = await verifyRetentionLedger(process.cwd(), runId);
            console.log(options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2));
            if (!result.ok)
                process.exitCode = 1;
            return;
        }
        const result = await retentionLedgerSummary(process.cwd(), runId);
        console.log(options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2));
    });
}
//# sourceMappingURL=retention-ledger.js.map