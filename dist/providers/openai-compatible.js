import { postChatCompletion, postChatCompletionStream } from "./chat.js";
function modelId(item) {
    if (typeof item === "string")
        return item;
    if (typeof item === "object" && item !== null && "id" in item) {
        const id = item.id;
        return typeof id === "string" ? id : undefined;
    }
    return undefined;
}
export function mapOpenAICompatibleModels(provider, payload) {
    const source = typeof payload === "object" && payload !== null && "data" in payload ? payload.data : payload;
    if (!Array.isArray(source))
        return [];
    return source.flatMap((item) => {
        const id = modelId(item);
        return id ? [{ id, provider }] : [];
    });
}
export class OpenAICompatibleProvider {
    name;
    baseUrl;
    apiKeyEnv;
    requestTimeoutMs;
    type = "openai-compatible";
    constructor(name, baseUrl, apiKeyEnv, requestTimeoutMs = 120_000) {
        this.name = name;
        this.baseUrl = baseUrl;
        this.apiKeyEnv = apiKeyEnv;
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
            message: "API key env var is configured"
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
            throw new Error(`OpenAI-compatible models request failed for ${this.name}: HTTP ${response.status}`);
        }
        return mapOpenAICompatibleModels(this.name, await response.json());
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
//# sourceMappingURL=openai-compatible.js.map