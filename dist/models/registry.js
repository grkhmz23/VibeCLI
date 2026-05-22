import { unknownCapabilities } from "./capabilities.js";
function providerPrivacy(provider) {
    if (provider.type === "openai-compatible" &&
        /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(provider.base_url)) {
        return "local";
    }
    return provider.type === "external-opencode" ? "local" : "external";
}
function costTierFromPricing(model) {
    const prompt = Number.parseFloat(model?.pricing?.prompt ?? "");
    const completion = Number.parseFloat(model?.pricing?.completion ?? "");
    const max = Math.max(Number.isFinite(prompt) ? prompt : 0, Number.isFinite(completion) ? completion : 0);
    if (!max)
        return "unknown";
    if (max <= 0.000001)
        return "low";
    if (max <= 0.00001)
        return "medium";
    return "high";
}
export function getModelCapabilities(args) {
    const provider = args.config.providers[args.provider];
    if (!provider)
        return unknownCapabilities;
    return {
        ...unknownCapabilities,
        supportsStreaming: provider.type === "external-opencode" ? false : "unknown",
        supportsJsonMode: provider.type === "external-opencode" ? false : "unknown",
        contextLength: args.metadata?.contextLength ?? null,
        costTier: costTierFromPricing(args.metadata),
        privacyTier: providerPrivacy(provider)
    };
}
//# sourceMappingURL=registry.js.map