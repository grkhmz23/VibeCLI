import type { AgentRoleId } from "../agents/roles.js";

export type ProviderType = "openrouter" | "openai-compatible" | "external-opencode";

export type ModelInfo = {
  id: string;
  name?: string;
  provider: string;
  contextLength?: number;
  inputModalities?: string[];
  outputModalities?: string[];
  pricing?: {
    prompt?: string;
    completion?: string;
    request?: string;
  };
};

export type ProviderHealth = {
  ok: boolean;
  provider: string;
  message: string;
};

export type AgentMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AgentRunRequest = {
  providerName: string;
  model: string;
  agentRole: AgentRoleId;
  messages: AgentMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json";
};

export type AgentRunResponse = {
  provider: string;
  model: string;
  role: AgentRoleId;
  content: string;
  raw?: unknown;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
};

export type AgentStreamEvent =
  | {
      type: "start";
      provider: string;
      model: string;
      role: AgentRoleId;
    }
  | {
      type: "delta";
      content: string;
    }
  | {
      type: "usage";
      usage: {
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
      };
    }
  | {
      type: "end";
      content: string;
    }
  | {
      type: "error";
      message: string;
    };

export interface ModelProvider {
  name: string;
  type: ProviderType;
  listModels(): Promise<ModelInfo[]>;
  healthCheck(): Promise<ProviderHealth>;
  runAgent?(request: AgentRunRequest): Promise<AgentRunResponse>;
  streamAgent?(request: AgentRunRequest): AsyncIterable<AgentStreamEvent>;
}
