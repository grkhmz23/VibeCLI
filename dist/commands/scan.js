import { refreshLedgerAfterOperation } from "../ledger/events.js";
import { scanRunBuiltin, scanRunExternal } from "../orchestrator/scan.js";
export function registerScanCommand(program) {
    program
        .command("scan")
        .argument("<run-id>", "run id")
        .option("--external", "run optional external scanners")
        .option("--confirm <confirmation>", "exact confirmation string")
        .option("--json", "print JSON")
        .description("Run scanner gates for a run")
        .action(async (runId, options) => {
        const result = options.external
            ? await scanRunExternal(process.cwd(), runId, options.confirm)
            : await scanRunBuiltin(process.cwd(), runId);
        await refreshLedgerAfterOperation(process.cwd(), runId);
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : `Scan complete: ${Array.isArray(result) ? result.map((r) => `${r.scanner}:${r.status}`).join(", ") : result.status}`);
    });
}
//# sourceMappingURL=scan.js.map