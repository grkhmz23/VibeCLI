import { OpenAICompatibleProvider } from "./openai-compatible.js";
import { OpenCodeExternalProvider } from "./opencode-external.js";
import { OpenRouterProvider } from "./openrouter.js";
export function createProvider(name, config, requestTimeoutMs = 120_000) {
    switch (config.type) {
        case "openrouter":
            return new OpenRouterProvider(name, config.api_key_env, config.base_url, requestTimeoutMs);
        case "openai-compatible":
            return new OpenAICompatibleProvider(name, config.base_url, config.api_key_env, requestTimeoutMs);
        case "external-opencode":
            return new OpenCodeExternalProvider(name);
    }
}
export function createProviderRegistry(config) {
    const requestTimeoutMs = config.provider_runtime.request_timeout_ms;
    return new Map(Object.entries(config.providers).map(([name, providerConfig]) => [
        name,
        createProvider(name, providerConfig, requestTimeoutMs)
    ]));
}
//# sourceMappingURL=registry.js.map