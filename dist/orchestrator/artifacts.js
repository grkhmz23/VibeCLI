import { join } from "node:path";
import { agentRoleIds, agentRoles } from "../agents/roles.js";
export const requiredRunArtifacts = [
    "input.json",
    "state.json",
    "agent-events.jsonl",
    "plan.json",
    "security-baseline.json",
    "final-report.md"
];
export function createPlanArtifact(state) {
    return {
        runId: state.runId,
        phase: 1,
        mode: "dry-run",
        agents: agentRoleIds.map((id) => ({
            id,
            displayName: agentRoles[id].displayName,
            purpose: agentRoles[id].purpose,
            requiredArtifacts: agentRoles[id].requiredArtifacts,
            gateCondition: agentRoles[id].gateCondition
        }))
    };
}
export function agentArtifactPath(runPath, agent, artifact) {
    return join(runPath, "agents", agent, artifact);
}
export function createFinalReport(state, profile) {
    const agents = agentRoleIds.map((id) => `- ${id}: ${state.agents[id].status}`).join("\n");
    const gates = agentRoleIds
        .map((id) => `- ${id}: ${state.gates[id].status} - ${state.gates[id].message ?? ""}`)
        .join("\n");
    return `# VibeCLI Phase 1 Run Report

Product: VibeCLI

Run id: ${state.runId}

User prompt: ${state.prompt}

Provider profile used: ${profile}

## Workflow Agents

${agents}

## Gate Results

${gates}

## Phase 1 Scope

This run was a Phase 1 dry-run orchestration foundation. Agents produced deterministic local artifacts and did not call LLMs or modify application source code.

## Next Implementation Step

Real LLM-backed agent execution and patch application.
`;
}
export function createPhaseTwoFinalReport(args) {
    const agents = agentRoleIds
        .map((id) => `- ${id}: ${args.state.agents[id].status} - ${args.state.agents[id].summary ?? ""}`)
        .join("\n");
    const repoSummary = args.repoContext
        ? `${args.repoContext.packageManager}; ${args.repoContext.detectedFrameworks.join(", ")}; ${args.repoContext.sourceFilesCount} source files; ${args.repoContext.testFilesCount} test files`
        : "Repo context was not collected.";
    return `# VibeCLI Phase ${args.state.phase ?? 2} Run Report

Product: VibeCLI

Phase: ${args.state.phase ?? 2}

Run mode: ${args.mode}

Run id: ${args.state.runId}

Prompt: ${args.state.prompt}

Provider profile used: ${args.profile}

## Repo Summary

${repoSummary}

## Agent Results

${agents}

## Safety Summary

Patch proposals count: ${args.patchCount}

Command recommendations count: ${args.commandCount}

Security verdict: ${args.securityVerdict}

Approval status: ${args.state.approval.status}

Model usage summary: ${args.modelUsageSummary}

Routing strategy: ${args.state.routingStrategy ?? "unknown"}

Policy profile: ${args.state.policy ?? "none"}

Budget status: ${args.state.budget?.status ?? "unknown"}

Ledger status: ${args.state.ledger?.status ?? "unknown"}

No source files were modified by agents in Phase ${args.state.phase ?? 2}.

## Next Step

Phase 3 will add guarded patch application after explicit approval.
`;
}
//# sourceMappingURL=artifacts.js.map