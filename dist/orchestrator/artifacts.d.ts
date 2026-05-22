import { type AgentRoleId } from "../agents/roles.js";
import type { RunState } from "./state.js";
import type { RepoContext } from "../context/repo-scanner.js";
export declare const requiredRunArtifacts: readonly ["input.json", "state.json", "agent-events.jsonl", "plan.json", "security-baseline.json", "final-report.md"];
export declare function createPlanArtifact(state: RunState): object;
export declare function agentArtifactPath(runPath: string, agent: AgentRoleId, artifact: string): string;
export declare function createFinalReport(state: RunState, profile: string): string;
export declare function createPhaseTwoFinalReport(args: {
    state: RunState;
    profile: string;
    mode: "dry-run" | "live";
    repoContext?: RepoContext;
    patchCount: number;
    commandCount: number;
    securityVerdict: string;
    modelUsageSummary: string;
}): string;
