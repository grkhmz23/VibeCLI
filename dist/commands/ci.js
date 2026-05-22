import { ingestCiFile, ingestGithubCi, showOrCreateLocalCiStatus } from "../release/ci.js";
export function registerCiCommand(program) {
    program
        .command("ci")
        .argument("<run-id>", "run id")
        .option("--github", "ingest read-only GitHub Actions status with gh")
        .option("--confirm <confirm>", "exact confirmation")
        .option("--file <path>", "local CI status JSON")
        .description("Show or ingest CI status")
        .action(async (runId, options) => {
        const result = options.github
            ? await ingestGithubCi(process.cwd(), runId, options.confirm)
            : options.file
                ? await ingestCiFile(process.cwd(), runId, options.file)
                : await showOrCreateLocalCiStatus(process.cwd(), runId);
        console.log(JSON.stringify(result, null, 2));
    });
}
//# sourceMappingURL=ci.js.map