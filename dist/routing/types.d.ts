import type { AgentRoleId } from "../agents/roles.js";
export type RouteSelection = {
    provider: string;
    model: string;
    reason: string;
    alias?: string;
};
export type RouteFallback = {
    provider: string;
    model: string;
    available: boolean;
    reason: string;
    alias?: string;
};
export type AgentRouteResult = {
    agent: AgentRoleId;
    selected: RouteSelection;
    fallbacks: RouteFallback[];
    warnings: string[];
};
export type RoutingPlan = {
    runId: string;
    createdAt: string;
    profile: string;
    policy?: string;
    strategy: string;
    agents: Array<{
        agent: string;
        selectedProvider: string;
        selectedModel: string;
        selectionReason: string;
        alias?: string;
        fallbacks: RouteFallback[];
        warnings: string[];
    }>;
};
