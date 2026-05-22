import { RunStore } from "../orchestrator/run-store.js";
export function registerInspectCommand(program) {
    program
        .command("inspect")
        .argument("<run-id>", "run id")
        .option("--json", "print raw state JSON")
        .description("Inspect a run")
        .action(async (runId, options) => {
        const state = await new RunStore(process.cwd()).readState(runId);
        if (options.json) {
            console.log(JSON.stringify(state, null, 2));
            return;
        }
        console.log(`Run id: ${state.runId}`);
        console.log(`Prompt: ${state.prompt}`);
        console.log(`Status: ${state.status}`);
        console.log(`Artifacts: ${state.artifactsPath}`);
        console.log(`Policy: ${state.policy ?? "none"}`);
        console.log(`Routing: ${state.routingStrategy ?? "unknown"}`);
        console.log(`Budget: ${state.budget?.status ?? "unknown"}`);
        console.log(`Ledger: ${state.ledger?.status ?? "unknown"}`);
        console.log(`Verification: ${state.verification?.status ?? "not_started"}`);
        console.log(`Scanners: ${state.scanners?.builtinStatus ?? "not_started"}/${state.scanners?.externalStatus ?? "not_started"}`);
        console.log(`Repair: ${state.repair?.status ?? "not_started"}`);
        console.log(`Lifecycle: branch=${state.lifecycle?.branch?.current ?? "unknown"} commit=${state.lifecycle?.commit?.status ?? "not_started"} pr=${state.lifecycle?.pr?.status ?? "not_started"} merge=${state.lifecycle?.mergeReadiness?.verdict ?? "not_started"}`);
        console.log(`Organization: enabled=${state.organization?.enabled ?? false} approvals=${state.organization?.approvals.status ?? "not_started"} retention=${state.organization?.retention.status ?? "not_started"} audit=${state.organization?.audit.status ?? "not_started"}`);
        console.log("Agents:");
        for (const [agent, agentState] of Object.entries(state.agents)) {
            console.log(`- ${agent}: ${agentState.status}`);
        }
    });
}
//# sourceMappingURL=inspect.js.map