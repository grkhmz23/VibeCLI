export function resolveModelAlias(config, alias) {
    const resolved = config.model_aliases[alias];
    if (!resolved)
        throw new Error(`Model alias ${alias} is not configured`);
    if (!config.providers[resolved.provider]) {
        throw new Error(`Model alias ${alias} references missing provider ${resolved.provider}`);
    }
    return { provider: resolved.provider, model: resolved.model, alias };
}
//# sourceMappingURL=aliases.js.map