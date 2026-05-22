import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { verifyLedger } from "../ledger/verify.js";
import { readPolicyExceptions } from "./policy-exceptions.js";
import { RunStore } from "../orchestrator/run-store.js";
const execFileAsync = promisify(execFile);
export async function evaluateReadiness(cwd, runId) {
    const store = new RunStore(cwd);
    const state = await store.readState(runId);
    const blockingReasons = [];
    const warnings = [];
    const passed = [];
    if (state.apply.status !== "applied") {
        return {
            runId,
            verdict: "not_applied",
            blockingReasons: ["Source changes have not been applied."],
            warnings,
            passed,
            nextActions: [`vibe review ${runId} --diff`, `vibe apply ${runId} --confirm "APPLY ${runId}"`]
        };
    }
    const ledger = await verifyLedger(cwd, runId).catch(() => undefined);
    if (!ledger?.ok)
        blockingReasons.push("Ledger verification failed or is missing.");
    else
        passed.push("Ledger verified.");
    if (state.verification?.status !== "passed")
        blockingReasons.push("Verification has not passed.");
    else
        passed.push("Verification passed.");
    if (state.scanners?.criticalFindings || state.scanners?.highFindings) {
        blockingReasons.push("Scanner has high or critical findings.");
    }
    else if (state.scanners?.builtinStatus === "warning" ||
        state.scanners?.externalStatus === "warning") {
        warnings.push("Scanner warnings are present.");
    }
    else {
        passed.push("Scanner gates have no high/critical findings.");
    }
    const exceptions = await readPolicyExceptions(cwd, runId);
    if (exceptions.exceptions.some((item) => item.status === "requested")) {
        blockingReasons.push("Policy exceptions are unresolved.");
    }
    const gitStatus = await execFileAsync("git", ["status", "--short"], { cwd })
        .then(({ stdout }) => stdout.trim())
        .catch(() => "");
    if (gitStatus)
        warnings.push("Git working tree has local changes.");
    return {
        runId,
        verdict: blockingReasons.length
            ? "blocked"
            : warnings.length
                ? "ready_with_warnings"
                : "ready_for_pr",
        blockingReasons,
        warnings,
        passed,
        nextActions: blockingReasons.length
            ? [`vibe workspace ${runId}`, `vibe verify ${runId} --confirm "VERIFY ${runId}"`]
            : [`vibe github pr ${runId}`]
    };
}
//# sourceMappingURL=readiness.js.map