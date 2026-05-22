import { describe, expect, it } from "vitest";
import { intakeAgentOutputSchema } from "../agents/contracts.js";
import { executeJsonAgent } from "../agents/executor.js";
import type {
  AgentRunRequest,
  AgentRunResponse,
  ModelProvider,
  ProviderHealth
} from "../providers/types.js";

class SequenceProvider implements ModelProvider {
  name = "test";
  type = "openai-compatible" as const;
  calls = 0;

  constructor(private readonly responses: string[]) {}

  listModels(): Promise<[]> {
    return Promise.resolve([]);
  }

  healthCheck(): Promise<ProviderHealth> {
    return Promise.resolve({ ok: true, provider: this.name, message: "ok" });
  }

  runAgent(request: AgentRunRequest): Promise<AgentRunResponse> {
    const content = this.responses[this.calls] ?? "";
    this.calls += 1;
    return Promise.resolve({
      provider: this.name,
      model: request.model,
      role: request.agentRole,
      content
    });
  }
}

describe("agent contracts", () => {
  it("valid agent outputs pass Zod validation", () => {
    expect(() =>
      intakeAgentOutputSchema.parse({
        goal: "Ship safely",
        repo_type: "existing_repo",
        acceptance_criteria: ["Tests pass"],
        blocking_questions: [],
        assumptions: [],
        risk_level: "low"
      })
    ).not.toThrow();
  });

  it("invalid JSON causes one schema correction retry", async () => {
    const provider = new SequenceProvider([
      "not json",
      JSON.stringify({
        goal: "Ship safely",
        repo_type: "existing_repo",
        acceptance_criteria: [],
        blocking_questions: [],
        assumptions: [],
        risk_level: "low"
      })
    ]);
    const result = await executeJsonAgent({
      provider,
      providerName: "test",
      model: "model",
      role: "intake",
      messages: [{ role: "user", content: "x" }]
    });
    expect(result.ok).toBe(true);
    expect(provider.calls).toBe(2);
  });

  it("invalid output after retry marks agent failed", async () => {
    const provider = new SequenceProvider(["not json", '{"goal":"missing fields"}']);
    const result = await executeJsonAgent({
      provider,
      providerName: "test",
      model: "model",
      role: "intake",
      messages: [{ role: "user", content: "x" }]
    });
    expect(result.ok).toBe(false);
    expect(provider.calls).toBe(2);
  });
});
