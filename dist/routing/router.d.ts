import type { AgentRoleId } from "../agents/roles.js";
import type { VibeConfig } from "../config/schema.js";
import type { AgentRouteResult, RoutingPlan } from "./types.js";
export declare function routeAgent(config: VibeConfig, profile: string, agent: AgentRoleId): AgentRouteResult;
export declare function buildRoutingPlan(args: {
    config: VibeConfig;
    profile: string;
    runId: string;
    agents: AgentRoleId[];
    policy?: string;
}): RoutingPlan;
