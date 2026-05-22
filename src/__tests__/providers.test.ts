import { describe, expect, it } from "vitest";
import { defaultConfig } from "../config/defaults.js";
import { createProviderRegistry } from "../providers/registry.js";
import { mapOpenRouterModels } from "../providers/openrouter.js";
import { parseOpenCodeModels } from "../providers/opencode-external.js";
import type { VibeConfig } from "../config/schema.js";

describe("providers", () => {
  it("instantiates openrouter, openai-compatible, and external-opencode providers", () => {
    const config: VibeConfig = {
      ...defaultConfig,
      providers: {
        openrouter: defaultConfig.providers.openrouter,
        local: {
          type: "openai-compatible",
          base_url: "http://localhost:11434/v1",
          api_key_env: "LOCAL_API_KEY"
        },
        opencode: {
          type: "external-opencode",
          username_env: "OPENCODE_SERVER_USERNAME",
          password_env: "OPENCODE_SERVER_PASSWORD"
        }
      }
    };
    const registry = createProviderRegistry(config);
    expect(registry.get("openrouter")?.type).toBe("openrouter");
    expect(registry.get("local")?.type).toBe("openai-compatible");
    expect(registry.get("opencode")?.type).toBe("external-opencode");
  });

  it("maps an OpenRouter /models response", () => {
    const models = mapOpenRouterModels("openrouter", {
      data: [
        {
          id: "openai/gpt-4o-mini",
          name: "GPT-4o mini",
          context_length: 128000,
          architecture: { input_modalities: ["text"], output_modalities: ["text"] },
          pricing: { prompt: "0.00000015", completion: "0.0000006" }
        }
      ]
    });
    expect(models).toEqual([
      {
        id: "openai/gpt-4o-mini",
        name: "GPT-4o mini",
        provider: "openrouter",
        contextLength: 128000,
        inputModalities: ["text"],
        outputModalities: ["text"],
        pricing: { prompt: "0.00000015", completion: "0.0000006", request: undefined }
      }
    ]);
  });

  it("extracts provider/model identifiers from OpenCode output", () => {
    const models = parseOpenCodeModels(
      "Available models: openai/gpt-4o anthropic/claude-sonnet-4.5 local.dev/not_a_match"
    );
    expect(models.map((model) => model.id)).toEqual([
      "anthropic/claude-sonnet-4.5",
      "local.dev/not_a_match",
      "openai/gpt-4o"
    ]);
  });
});
