import { refreshLedgerAfterOperation } from "../ledger/events.js";
import { applyRun } from "../orchestrator/apply.js";
export function registerApplyCommand(program) {
    program
        .command("apply")
        .argument("<run-id>", "run id")
        .option("--confirm <confirmation>", "exact confirmation string")
        .option("--dry-run", "validate without modifying files")
        .option("--json", "print JSON")
        .option("--allow-lockfiles", "allow lockfile patching")
        .description("Apply approved patch proposals with rollback artifacts")
        .action(async (runId, options) => {
        const result = await applyRun(process.cwd(), runId, {
            confirm: options.confirm,
            dryRun: Boolean(options.dryRun),
            allowLockfiles: Boolean(options.allowLockfiles)
        });
        await refreshLedgerAfterOperation(process.cwd(), runId);
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : options.dryRun
                ? `Validation ${result.status === "dry_run_passed" ? "passed" : "failed"}. No files modified.`
                : `Apply ${result.status}: Files modified only after approval and confirmation. ${result.filesChanged.join(", ") || "no files"}`);
    });
}
//# sourceMappingURL=apply.js.map