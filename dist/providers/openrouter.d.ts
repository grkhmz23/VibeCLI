import type { AgentRunRequest, AgentRunResponse, AgentStreamEvent, ModelInfo, ModelProvider, ProviderHealth } from "./types.js";
export declare function mapOpenRouterModels(provider: string, payload: unknown): ModelInfo[];
export declare class OpenRouterProvider implements ModelProvider {
    readonly name: string;
    private readonly apiKeyEnv;
    private readonly baseUrl;
    private readonly requestTimeoutMs;
    type: "openrouter";
    constructor(name: string, apiKeyEnv: string, baseUrl?: string, requestTimeoutMs?: number);
    healthCheck(): Promise<ProviderHealth>;
    listModels(): Promise<ModelInfo[]>;
    runAgent(request: AgentRunRequest): Promise<AgentRunResponse>;
    streamAgent(request: AgentRunRequest): AsyncIterable<AgentStreamEvent>;
}
