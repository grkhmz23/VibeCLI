import { resolveModelAlias } from "../models/aliases.js";
export function resolveAgentModelRef(config, provider, model, modelAlias) {
    if (model && modelAlias)
        throw new Error("Agent cannot set both model and model_alias");
    if (modelAlias)
        return resolveModelAlias(config, modelAlias);
    if (!model)
        throw new Error("Agent must set model or model_alias");
    return { provider, model };
}
export function resolveFallbacks(config, fallbackModels = []) {
    return fallbackModels.map((fallback) => resolveAgentModelRef(config, fallback.provider ?? "", fallback.model, fallback.model_alias));
}
//# sourceMappingURL=fallback.js.map