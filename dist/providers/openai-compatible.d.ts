import type { AgentRunRequest, AgentRunResponse, AgentStreamEvent, ModelInfo, ModelProvider, ProviderHealth } from "./types.js";
export declare function mapOpenAICompatibleModels(provider: string, payload: unknown): ModelInfo[];
export declare class OpenAICompatibleProvider implements ModelProvider {
    readonly name: string;
    private readonly baseUrl;
    private readonly apiKeyEnv;
    private readonly requestTimeoutMs;
    type: "openai-compatible";
    constructor(name: string, baseUrl: string, apiKeyEnv: string, requestTimeoutMs?: number);
    healthCheck(): Promise<ProviderHealth>;
    listModels(): Promise<ModelInfo[]>;
    runAgent(request: AgentRunRequest): Promise<AgentRunResponse>;
    streamAgent(request: AgentRunRequest): AsyncIterable<AgentStreamEvent>;
}
