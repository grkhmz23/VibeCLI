import type { AgentRoleId } from "../agents/roles.js";
import type { VibeConfig } from "../config/schema.js";
import { resolveAgentModelRef, resolveFallbacks } from "./fallback.js";
import { routingStrategyForProfile, strategyAllowsFallback } from "./policy.js";
import type { AgentRouteResult, RoutingPlan } from "./types.js";

function providerAvailable(
  config: VibeConfig,
  providerName: string
): { available: boolean; reason: string } {
  const provider = config.providers[providerName];
  if (!provider) return { available: false, reason: `Provider ${providerName} is not configured` };
  if ("api_key_env" in provider && !process.env[provider.api_key_env]) {
    return { available: false, reason: `Missing env var ${provider.api_key_env}` };
  }
  if (provider.type === "external-opencode") {
    return { available: false, reason: "external-opencode live execution is not enabled" };
  }
  return { available: true, reason: "Provider is configured and required env vars are present" };
}

export function routeAgent(
  config: VibeConfig,
  profile: string,
  agent: AgentRoleId
): AgentRouteResult {
  const agentConfig = config.profiles[profile]?.agents[agent];
  if (!agentConfig) throw new Error(`Agent ${agent} is not configured in profile ${profile}`);
  const strategy = routingStrategyForProfile(config, profile);
  const primary = resolveAgentModelRef(
    config,
    agentConfig.provider,
    agentConfig.model,
    agentConfig.model_alias
  );
  const candidates = [primary, ...resolveFallbacks(config, agentConfig.fallback_models)];
  const fallbacks = candidates.slice(1).map((candidate) => {
    const availability = providerAvailable(config, candidate.provider);
    return {
      provider: candidate.provider,
      model: candidate.model,
      alias: candidate.alias,
      available: availability.available,
      reason: availability.reason
    };
  });
  const primaryAvailability = providerAvailable(config, primary.provider);
  const fallbackAllowed = strategyAllowsFallback(config, strategy);
  const selected =
    primaryAvailability.available || !fallbackAllowed
      ? {
          provider: primary.provider,
          model: primary.model,
          alias: primary.alias,
          reason: primaryAvailability.available
            ? `Selected primary route using ${strategy} strategy`
            : primaryAvailability.reason
        }
      : (fallbacks.find((fallback) => fallback.available) ?? {
          provider: primary.provider,
          model: primary.model,
          alias: primary.alias,
          available: false,
          reason: "No available fallback route"
        });
  const warnings = [
    ...(primaryAvailability.available ? [] : [primaryAvailability.reason]),
    ...(fallbackAllowed ? [] : ["Fallback is disabled by routing strategy"])
  ];
  return {
    agent,
    selected: {
      provider: selected.provider,
      model: selected.model,
      alias: selected.alias,
      reason: selected.reason
    },
    fallbacks,
    warnings
  };
}

export function buildRoutingPlan(args: {
  config: VibeConfig;
  profile: string;
  runId: string;
  agents: AgentRoleId[];
  policy?: string;
}): RoutingPlan {
  const strategy = routingStrategyForProfile(args.config, args.profile);
  return {
    runId: args.runId,
    createdAt: new Date().toISOString(),
    profile: args.profile,
    policy: args.policy,
    strategy,
    agents: args.agents.map((agent) => {
      const route = routeAgent(args.config, args.profile, agent);
      return {
        agent,
        selectedProvider: route.selected.provider,
        selectedModel: route.selected.model,
        selectionReason: route.selected.reason,
        alias: route.selected.alias,
        fallbacks: route.fallbacks,
        warnings: route.warnings
      };
    })
  };
}
