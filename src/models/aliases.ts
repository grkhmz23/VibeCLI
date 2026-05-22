import type { VibeConfig } from "../config/schema.js";

export type ResolvedModelRef = {
  provider: string;
  model: string;
  alias?: string;
};

export function resolveModelAlias(config: VibeConfig, alias: string): ResolvedModelRef {
  const resolved = config.model_aliases[alias];
  if (!resolved) throw new Error(`Model alias ${alias} is not configured`);
  if (!config.providers[resolved.provider]) {
    throw new Error(`Model alias ${alias} references missing provider ${resolved.provider}`);
  }
  return { provider: resolved.provider, model: resolved.model, alias };
}
