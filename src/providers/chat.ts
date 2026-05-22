import type { AgentRunRequest, AgentRunResponse, AgentStreamEvent } from "./types.js";

const transientStatuses = new Set([429, 500, 502, 503, 504]);

type ChatCompletionPayload = {
  choices?: Array<{ message?: { content?: unknown }; text?: unknown }>;
  usage?: {
    prompt_tokens?: unknown;
    completion_tokens?: unknown;
    total_tokens?: unknown;
    promptTokens?: unknown;
    completionTokens?: unknown;
    totalTokens?: unknown;
  };
};

function numeric(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function parseChatCompletion(
  provider: string,
  request: AgentRunRequest,
  payload: unknown
): AgentRunResponse {
  if (typeof payload !== "object" || payload === null) {
    throw new Error(`Provider ${provider} returned a malformed chat completion response`);
  }
  const completion = payload as ChatCompletionPayload;
  const firstChoice = completion.choices?.[0];
  const content =
    typeof firstChoice?.message?.content === "string"
      ? firstChoice.message.content
      : typeof firstChoice?.text === "string"
        ? firstChoice.text
        : undefined;
  if (!content) {
    throw new Error(`Provider ${provider} returned no assistant content`);
  }
  const usage = completion.usage;
  return {
    provider,
    model: request.model,
    role: request.agentRole,
    content,
    raw: payload,
    usage: usage
      ? {
          promptTokens: numeric(usage.prompt_tokens ?? usage.promptTokens),
          completionTokens: numeric(usage.completion_tokens ?? usage.completionTokens),
          totalTokens: numeric(usage.total_tokens ?? usage.totalTokens)
        }
      : undefined
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Provider request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function postChatCompletion(args: {
  provider: string;
  baseUrl: string;
  apiKey: string | undefined;
  apiKeyEnv: string;
  request: AgentRunRequest;
  timeoutMs: number;
}): Promise<AgentRunResponse> {
  if (!args.apiKey) {
    throw new Error(`Provider ${args.provider} is missing env var ${args.apiKeyEnv}`);
  }

  const body = {
    model: args.request.model,
    messages: args.request.messages,
    temperature: args.request.temperature ?? 0.2,
    max_tokens: args.request.maxTokens,
    response_format: args.request.responseFormat === "json" ? { type: "json_object" } : undefined
  };

  let lastError: Error | undefined;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetchWithTimeout(
      `${args.baseUrl.replace(/\/$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${args.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      },
      args.timeoutMs
    );

    if (response.ok) {
      return parseChatCompletion(args.provider, args.request, await response.json());
    }

    const text = await response.text();
    const message = `Provider ${args.provider} chat completion failed: HTTP ${response.status}${
      text ? ` ${text.slice(0, 300)}` : ""
    }`;
    if (
      response.status === 401 ||
      response.status === 403 ||
      !transientStatuses.has(response.status)
    ) {
      throw new Error(message);
    }
    lastError = new Error(message);
    if (attempt < 2) {
      await sleep(100 * 2 ** attempt);
    }
  }

  throw lastError ?? new Error(`Provider ${args.provider} chat completion failed`);
}

function parseSseJson(line: string): unknown {
  if (!line.startsWith("data:")) return undefined;
  const data = line.slice(5).trim();
  if (!data || data === "[DONE]") return undefined;
  return JSON.parse(data) as unknown;
}

function deltaFromPayload(payload: unknown): string {
  if (typeof payload !== "object" || payload === null || !("choices" in payload)) return "";
  const choices = payload.choices;
  if (!Array.isArray(choices)) return "";
  const first = choices[0] as
    | { delta?: { content?: unknown }; message?: { content?: unknown } }
    | undefined;
  const content = first?.delta?.content ?? first?.message?.content;
  return typeof content === "string" ? content : "";
}

export async function* postChatCompletionStream(args: {
  provider: string;
  baseUrl: string;
  apiKey: string | undefined;
  apiKeyEnv: string;
  request: AgentRunRequest;
  timeoutMs: number;
}): AsyncIterable<AgentStreamEvent> {
  if (!args.apiKey) {
    yield {
      type: "error",
      message: `Provider ${args.provider} is missing env var ${args.apiKeyEnv}`
    };
    return;
  }
  yield {
    type: "start",
    provider: args.provider,
    model: args.request.model,
    role: args.request.agentRole
  };
  const response = await fetchWithTimeout(
    `${args.baseUrl.replace(/\/$/, "")}/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: args.request.model,
        messages: args.request.messages,
        temperature: args.request.temperature ?? 0.2,
        max_tokens: args.request.maxTokens,
        response_format:
          args.request.responseFormat === "json" ? { type: "json_object" } : undefined,
        stream: true
      })
    },
    args.timeoutMs
  );
  if (!response.ok || !response.body) {
    yield {
      type: "error",
      message: `Provider ${args.provider} stream failed: HTTP ${response.status}`
    };
    return;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      try {
        const payload = parseSseJson(line);
        if (!payload) continue;
        const delta = deltaFromPayload(payload);
        if (delta) {
          content += delta;
          yield { type: "delta", content: delta };
        }
      } catch (error) {
        yield { type: "error", message: error instanceof Error ? error.message : String(error) };
      }
    }
  }
  yield { type: "end", content };
}
