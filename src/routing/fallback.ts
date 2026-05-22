import type { VibeConfig } from "../config/schema.js";
import { resolveModelAlias, type ResolvedModelRef } from "../models/aliases.js";

export function resolveAgentModelRef(
  config: VibeConfig,
  provider: string,
  model: string | undefined,
  modelAlias: string | undefined
): ResolvedModelRef {
  if (model && modelAlias) throw new Error("Agent cannot set both model and model_alias");
  if (modelAlias) return resolveModelAlias(config, modelAlias);
  if (!model) throw new Error("Agent must set model or model_alias");
  return { provider, model };
}

export function resolveFallbacks(
  config: VibeConfig,
  fallbackModels: Array<{ provider?: string; model?: string; model_alias?: string }> = []
): ResolvedModelRef[] {
  return fallbackModels.map((fallback) =>
    resolveAgentModelRef(config, fallback.provider ?? "", fallback.model, fallback.model_alias)
  );
}
