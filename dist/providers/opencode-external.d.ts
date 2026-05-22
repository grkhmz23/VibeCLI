import type { AgentRunRequest, AgentRunResponse, ModelInfo, ModelProvider, ProviderHealth } from "./types.js";
export declare function parseOpenCodeModels(output: string, provider?: string): ModelInfo[];
export declare class OpenCodeExternalProvider implements ModelProvider {
    readonly name: string;
    type: "external-opencode";
    constructor(name: string);
    healthCheck(): Promise<ProviderHealth>;
    listModels(): Promise<ModelInfo[]>;
    runAgent(request: AgentRunRequest): Promise<AgentRunResponse>;
}
