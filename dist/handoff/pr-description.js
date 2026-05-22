import { join } from "node:path";
import { pathExists, readJson } from "../utils/fs.js";
import { RunStore } from "../orchestrator/run-store.js";
import { redactHandoffText } from "./redaction.js";
async function optionalJson(path) {
    return pathExists(path) ? readJson(path) : undefined;
}
export async function generatePrDescription(cwd, runId, summary) {
    const store = new RunStore(cwd);
    const state = await store.readState(runId);
    const runPath = store.runPath(runId);
    const verification = await optionalJson(join(runPath, "verification-results.json"));
    const scanners = await optionalJson(join(runPath, "scanner-results.json"));
    const cost = await optionalJson(join(runPath, "cost-estimate.json"));
    const title = `VibeCLI handoff: ${state.prompt.slice(0, 72)}`;
    const verificationText = verification?.status
        ? `Verification status: ${verification.status}`
        : "Verification commands were not executed.";
    const scannerText = scanners?.length
        ? `Scanner status: ${scanners.map((scanner) => scanner.status).join(", ")}`
        : "Scanner checks were not executed.";
    const applyText = state.apply.status === "applied"
        ? `Files changed: ${state.apply.filesChanged.join(", ") || "none recorded"}`
        : "Patch proposals exist but have not been applied.";
    const ledgerText = summary?.ledgerStatus === "fail"
        ? "Run ledger verification failed; review artifacts manually."
        : `Run ledger: ${summary?.ledgerStatus ?? "unknown"}`;
    const body = `# ${title}

## Summary

Prompt: ${state.prompt}

${applyText}

## Scope

- Run id: ${runId}
- Run status: ${state.status}
- Approval: ${state.approval.status}
- Apply: ${state.apply.status}

## Agent Workflow

${Object.entries(state.agents)
        .map(([agent, agentState]) => `- ${agent}: ${agentState.status}`)
        .join("\n")}

## Verification

${verificationText}

## Scanners And Security

${scannerText}

This PR body does not claim the change is secure. Review scanner results, security notes, and policy exceptions before approval.

## Policy And Routing

- Policy profile: ${state.policy ?? "none"}
- Routing strategy: ${state.routingStrategy ?? "unknown"}
- Providers/models: see routing-plan.json. No provider secrets are included.

## Cost

${cost?.known ? `Estimated cost: $${cost.estimatedUsd}` : "Cost estimate is unknown or unavailable."}

## Rollback Plan

Use \`vibe rollback ${runId} --confirm "ROLLBACK ${runId}"\` if this run was applied and needs to be reverted.

## Reviewer Checklist

See \`handoff/REVIEW_CHECKLIST.md\`.

## Known Limitations

- ${verification?.status ? "Verification results are local command results." : "Verification commands were not executed."}
- ${scanners?.length ? "Scanner results are local scanner outputs." : "Scanner checks were not executed."}
- ${ledgerText}
`;
    return {
        runId,
        path: join(".vibecli", "runs", runId, "handoff", "PR_DESCRIPTION.md"),
        title,
        body: redactHandoffText(body)
    };
}
//# sourceMappingURL=pr-description.js.map