import type { VibeConfig } from "../config/schema.js";
import { type ResolvedModelRef } from "../models/aliases.js";
export declare function resolveAgentModelRef(config: VibeConfig, provider: string, model: string | undefined, modelAlias: string | undefined): ResolvedModelRef;
export declare function resolveFallbacks(config: VibeConfig, fallbackModels?: Array<{
    provider?: string;
    model?: string;
    model_alias?: string;
}>): ResolvedModelRef[];
