import { createHandoffBundle } from "../handoff/bundle.js";
import { generatePrDescription } from "../handoff/pr-description.js";
import { RunStore } from "../orchestrator/run-store.js";
export function registerPrBodyCommand(program) {
    program
        .command("pr-body")
        .argument("<run-id>", "run id")
        .option("--json", "print JSON")
        .description("Generate PR body from run handoff artifacts")
        .action(async (runId, options) => {
        const summary = await createHandoffBundle(process.cwd(), runId);
        const pr = await generatePrDescription(process.cwd(), runId, summary);
        await new RunStore(process.cwd()).writeTextArtifact(runId, "handoff/PR_DESCRIPTION.md", pr.body);
        console.log(options.json ? JSON.stringify(pr, null, 2) : pr.body);
    });
}
//# sourceMappingURL=pr-body.js.map