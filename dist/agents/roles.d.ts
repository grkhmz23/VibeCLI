import type { RolePermission } from "./permissions.js";
export declare const agentRoleIds: readonly ["intake", "repo_scanner", "architect", "implementation", "test", "security", "release_manager", "fixer"];
export declare const workflowAgentRoleIds: ("security" | "release_manager" | "intake" | "repo_scanner" | "architect" | "implementation" | "test")[];
export type AgentRoleId = (typeof agentRoleIds)[number];
export type AgentRole = {
    id: AgentRoleId;
    displayName: string;
    purpose: string;
    permissions: RolePermission;
    requiredArtifacts: string[];
    gateCondition: string;
};
export declare const agentRoles: Record<AgentRoleId, AgentRole>;
