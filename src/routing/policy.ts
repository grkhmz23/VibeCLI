import type { VibeConfig } from "../config/schema.js";

export function routingStrategyForProfile(config: VibeConfig, profile: string): string {
  return (
    config.profiles[profile]?.routing_strategy ?? config.routing.default_strategy ?? "balanced"
  );
}

export function strategyAllowsFallback(config: VibeConfig, strategy: string): boolean {
  return config.routing.strategies[strategy]?.allow_fallback ?? true;
}
