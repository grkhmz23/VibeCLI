import { postChatCompletion, postChatCompletionStream } from "./chat.js";
import type {
  AgentRunRequest,
  AgentRunResponse,
  AgentStreamEvent,
  ModelInfo,
  ModelProvider,
  ProviderHealth
} from "./types.js";

type OpenRouterModel = {
  id?: unknown;
  name?: unknown;
  context_length?: unknown;
  architecture?: { input_modalities?: unknown; output_modalities?: unknown };
  pricing?: { prompt?: unknown; completion?: unknown; request?: unknown };
};

function stringArray(value: unknown): string[] | undefined {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function mapOpenRouterModels(provider: string, payload: unknown): ModelInfo[] {
  const data =
    typeof payload === "object" && payload !== null && "data" in payload ? payload.data : [];
  if (!Array.isArray(data)) return [];
  return data.flatMap((item): ModelInfo[] => {
    const model = item as OpenRouterModel;
    const id = stringValue(model.id);
    if (!id) return [];
    const contextLength =
      typeof model.context_length === "number" ? model.context_length : undefined;
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

export class OpenRouterProvider implements ModelProvider {
  type = "openrouter" as const;

  constructor(
    public readonly name: string,
    private readonly apiKeyEnv: string,
    private readonly baseUrl = "https://openrouter.ai/api/v1",
    private readonly requestTimeoutMs = 120_000
  ) {}

  healthCheck(): Promise<ProviderHealth> {
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

  async listModels(): Promise<ModelInfo[]> {
    const apiKey = process.env[this.apiKeyEnv];
    if (!apiKey) throw new Error(`Provider ${this.name} is missing env var ${this.apiKeyEnv}`);
    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    if (!response.ok) {
      throw new Error(`OpenRouter models request failed for ${this.name}: HTTP ${response.status}`);
    }
    return mapOpenRouterModels(this.name, await response.json());
  }

  async runAgent(request: AgentRunRequest): Promise<AgentRunResponse> {
    return postChatCompletion({
      provider: this.name,
      baseUrl: this.baseUrl,
      apiKey: process.env[this.apiKeyEnv],
      apiKeyEnv: this.apiKeyEnv,
      request,
      timeoutMs: this.requestTimeoutMs
    });
  }

  streamAgent(request: AgentRunRequest): AsyncIterable<AgentStreamEvent> {
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
