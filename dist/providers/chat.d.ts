import type { AgentRunRequest, AgentRunResponse, AgentStreamEvent } from "./types.js";
export declare function postChatCompletion(args: {
    provider: string;
    baseUrl: string;
    apiKey: string | undefined;
    apiKeyEnv: string;
    request: AgentRunRequest;
    timeoutMs: number;
}): Promise<AgentRunResponse>;
export declare function postChatCompletionStream(args: {
    provider: string;
    baseUrl: string;
    apiKey: string | undefined;
    apiKeyEnv: string;
    request: AgentRunRequest;
    timeoutMs: number;
}): AsyncIterable<AgentStreamEvent>;
