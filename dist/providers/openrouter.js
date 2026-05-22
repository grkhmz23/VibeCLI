import { postChatCompletion, postChatCompletionStream } from "./chat.js";
function stringArray(value) {
    return Array.isArray(value)
        ? value.filter((item) => typeof item === "string")
        : undefined;
}
function stringValue(value) {
    return typeof value === "string" ? value : undefined;
}
export function mapOpenRouterModels(provider, payload) {
    const data = typeof payload === "object" && payload !== null && "data" in payload ? payload.data : [];
    if (!Array.isArray(data))
        return [];
    return data.flatMap((item) => {
        const model = item;
        const id = stringValue(model.id);
        if (!id)
            return [];
        const contextLength = typeof model.context_length === "number" ? model.context_length : undefined;
        return [
            {
                id,
                name: stringValue(model.name),
                provider,
                contextLength,
                inputModalities: stringArray(model.architecture?.input_modalities),
                outputModalities: stringArray(model.architecture?.output_modalities),
                pricing: {
                    prompt: stringValue(model.pricing?.prompt),
                    completion: stringValue(model.pricing?.completion),
                    request: stringValue(model.pricing?.request)
                }
            }
        ];
    });
}
export class OpenRouterProvider {
    name;
    apiKeyEnv;
    baseUrl;
    requestTimeoutMs;
    type = "openrouter";
    constructor(name, apiKeyEnv, baseUrl = "https://openrouter.ai/api/v1", requestTimeoutMs = 120_000) {
        this.name = name;
        this.apiKeyEnv = apiKeyEnv;
        this.baseUrl = baseUrl;
        this.requestTimeoutMs = requestTimeoutMs;
    }
    healthCheck() {
        if (!process.env[this.apiKeyEnv]) {
            return Promise.resolve({
                ok: false,
                provider: this.name,
                message: `Missing env var ${this.apiKeyEnv}`
            });
        }
        return Promise.resolve({
            ok: true,
            provider: this.name,
            message: "OpenRouter API key env var is configured"
        });
    }
    async listModels() {
        const apiKey = process.env[this.apiKeyEnv];
        if (!apiKey)
            throw new Error(`Provider ${this.name} is missing env var ${this.apiKeyEnv}`);
        const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/models`, {
            headers: { Authorization: `Bearer ${apiKey}` }
        });
        if (!response.ok) {
            throw new Error(`OpenRouter models request failed for ${this.name}: HTTP ${response.status}`);
        }
        return mapOpenRouterModels(this.name, await response.json());
    }
    async runAgent(request) {
        return postChatCompletion({
            provider: this.name,
            baseUrl: this.baseUrl,
            apiKey: process.env[this.apiKeyEnv],
            apiKeyEnv: this.apiKeyEnv,
            request,
            timeoutMs: this.requestTimeoutMs
        });
    }
    streamAgent(request) {
        return postChatCompletionStream({
            provider: this.name,
            baseUrl: this.baseUrl,
            apiKey: process.env[this.apiKeyEnv],
            apiKeyEnv: this.apiKeyEnv,
            request,
            timeoutMs: this.requestTimeoutMs
        });
    }
}
//# sourceMappingURL=openrouter.js.map