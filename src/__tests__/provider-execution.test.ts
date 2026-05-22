import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenAICompatibleProvider } from "../providers/openai-compatible.js";
import { OpenRouterProvider } from "../providers/openrouter.js";
import type { AgentRunResponse } from "../providers/types.js";

const originalFetch = globalThis.fetch;

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function mockFetch(response: Response) {
  return vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    void input;
    void init;
    return Promise.resolve(response);
  });
}

const request = {
  providerName: "provider",
  model: "model-a",
  agentRole: "intake" as const,
  messages: [{ role: "user" as const, content: "Return JSON" }],
  responseFormat: "json" as const
};

describe("provider execution", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env.TEST_PROVIDER_KEY;
    vi.restoreAllMocks();
  });

  it("maps OpenRouter chat completion requests", async () => {
    process.env.TEST_PROVIDER_KEY = "secret";
    const fetchMock = mockFetch(
      jsonResponse(200, {
        choices: [{ message: { content: '{"ok":true}' } }],
        usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 }
      })
    );
    globalThis.fetch = fetchMock;
    const provider = new OpenRouterProvider(
      "openrouter",
      "TEST_PROVIDER_KEY",
      "https://openrouter.ai/api/v1"
    );
    const response: AgentRunResponse = await provider.runAgent(request);
    expect(response.content).toBe('{"ok":true}');
    expect(response.usage?.totalTokens).toBe(3);
    const firstCall = fetchMock.mock.calls[0];
    expect(firstCall).toBeDefined();
    const init = firstCall?.[1];
    const rawBody = init?.body;
    if (typeof rawBody !== "string") throw new Error("Expected string request body");
    const body = JSON.parse(rawBody) as { model: string };
    expect(firstCall?.[0]).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(body.model).toBe("model-a");
  });

  it("maps OpenAI-compatible chat completion requests", async () => {
    process.env.TEST_PROVIDER_KEY = "secret";
    const fetchMock = mockFetch(
      jsonResponse(200, { choices: [{ message: { content: '{"ok":true}' } }] })
    );
    globalThis.fetch = fetchMock;
    const provider = new OpenAICompatibleProvider(
      "local",
      "http://localhost:11434/v1",
      "TEST_PROVIDER_KEY"
    );
    await provider.runAgent(request);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:11434/v1/chat/completions");
  });

  it("returns a clear missing env var error", async () => {
    const provider = new OpenRouterProvider("openrouter", "TEST_PROVIDER_KEY");
    await expect(provider.runAgent(request)).rejects.toThrow("TEST_PROVIDER_KEY");
  });

  it("does not retry 401 or 403", async () => {
    process.env.TEST_PROVIDER_KEY = "secret";
    const fetchMock = mockFetch(jsonResponse(401, { error: "bad key" }));
    globalThis.fetch = fetchMock;
    const provider = new OpenRouterProvider("openrouter", "TEST_PROVIDER_KEY");
    await expect(provider.runAgent(request)).rejects.toThrow("HTTP 401");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries one 429 then succeeds", async () => {
    process.env.TEST_PROVIDER_KEY = "secret";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(429, { error: "rate limited" }))
      .mockResolvedValueOnce(
        jsonResponse(200, { choices: [{ message: { content: '{"ok":true}' } }] })
      );
    globalThis.fetch = fetchMock;
    const provider = new OpenRouterProvider("openrouter", "TEST_PROVIDER_KEY");
    await expect(provider.runAgent(request)).resolves.toMatchObject({ content: '{"ok":true}' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
