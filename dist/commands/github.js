import { githubDoctor } from "../github/gh.js";
import { githubPr } from "../github/pr.js";
import { updateGithubPr } from "../github/pr-update.js";
import { githubReleaseDraft } from "../github/release-draft.js";
export function registerGithubCommand(program) {
    const github = program.command("github").description("Optional GitHub handoff commands");
    github
        .command("doctor")
        .option("--json", "print JSON")
        .description("Diagnose GitHub CLI integration")
        .action(async (options) => {
        const result = await githubDoctor(process.cwd());
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : `gh:${result.ghInstalled ? "ok" : "missing"} auth:${result.authenticated ? "ok" : "missing"} remote:${result.remote ?? "none"}`);
    });
    github
        .command("pr")
        .argument("<run-id>", "run id")
        .option("--create", "create PR with gh")
        .option("--update", "update PR body")
        .option("--comment", "post PR handoff comment")
        .option("--sync", "update PR body and post comment")
        .option("--pr <pr>", "PR number or URL")
        .option("--push", "push current branch before PR creation")
        .option("--confirm <confirm>", "exact confirmation")
        .option("--allow-ledger-warning", "allow failed ledger warning")
        .option("--allow-risk", "allow high/critical scanner risk")
        .option("--allow-unverified", "allow missing verification")
        .option("--allow-main-branch", "allow main/master branch")
        .option("--allow-dirty", "allow dirty working tree for push")
        .option("--json", "print JSON")
        .description("Prepare or create GitHub PR")
        .action(async (runId, options) => {
        const result = options.update || options.comment || options.sync
            ? await updateGithubPr(process.cwd(), runId, {
                pr: options.pr ?? "",
                mode: options.sync ? "sync" : options.comment ? "comment" : "update",
                confirm: options.confirm,
                allowLedgerWarning: options.allowLedgerWarning,
                allowRisk: options.allowRisk,
                allowUnverified: options.allowUnverified
            })
            : await githubPr(process.cwd(), runId, options);
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : `GitHub PR ${result.mode}: ${result.prUrl ?? result.title}`);
    });
    github
        .command("release")
        .argument("<run-id>", "run id")
        .option("--check-remote-tag", "check remote tag read-only")
        .option("--create-draft", "create GitHub draft release")
        .option("--update-draft", "update GitHub draft release")
        .option("--tag <tag>", "release tag")
        .option("--confirm <confirm>", "exact confirmation")
        .option("--allow-unsigned-provenance", "allow missing signed provenance")
        .option("--allow-ledger-warning", "allow failed ledger warning")
        .option("--allow-blocked", "allow blocked release readiness")
        .option("--json", "print JSON")
        .description("Preview or create a GitHub draft release")
        .action(async (runId, options) => {
        const result = await githubReleaseDraft(process.cwd(), runId, options);
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : `GitHub release ${result.mode}: ${result.tag ?? result.title}`);
    });
}
//# sourceMappingURL=github.js.map