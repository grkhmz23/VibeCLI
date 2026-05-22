import { archiveHandoffBundle, createHandoffBundle, verifyHandoffBundle } from "../handoff/bundle.js";
import { evaluateReadiness } from "../handoff/readiness.js";
export function registerHandoffCommand(program) {
    program
        .command("handoff")
        .argument("<run-id>", "run id")
        .option("--json", "print JSON")
        .option("--verify", "verify handoff bundle")
        .option("--zip", "create redacted handoff archive")
        .option("--refresh", "refresh handoff files")
        .option("--strict", "fail if readiness or integrity has blocking issues")
        .description("Create or verify a team review handoff bundle")
        .action(async (runId, options) => {
        if (options.verify) {
            const result = await verifyHandoffBundle(process.cwd(), runId);
            console.log(options.json
                ? JSON.stringify(result, null, 2)
                : `Handoff ${result.ok ? "PASS" : "FAIL"}: ${result.files.length} files checked`);
            if (!result.ok)
                process.exitCode = 1;
            return;
        }
        const summary = await createHandoffBundle(process.cwd(), runId);
        if (options.zip) {
            const archive = await archiveHandoffBundle(process.cwd(), runId);
            console.log(`Created redacted handoff archive: ${archive.path}`);
        }
        if (options.strict) {
            const readiness = await evaluateReadiness(process.cwd(), runId);
            if (summary.ledgerStatus === "fail" ||
                readiness.verdict === "blocked" ||
                readiness.verdict === "not_applied") {
                process.exitCode = 1;
            }
        }
        console.log(options.json ? JSON.stringify(summary, null, 2) : `Handoff ready: ${runId}`);
    });
}
//# sourceMappingURL=handoff.js.map