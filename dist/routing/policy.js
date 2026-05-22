export function routingStrategyForProfile(config, profile) {
    return (config.profiles[profile]?.routing_strategy ?? config.routing.default_strategy ?? "balanced");
}
export function strategyAllowsFallback(config, strategy) {
    return config.routing.strategies[strategy]?.allow_fallback ?? true;
}
//# sourceMappingURL=policy.js.map