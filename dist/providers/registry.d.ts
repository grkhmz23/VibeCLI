import type { VibeConfig } from "../config/schema.js";
import type { ModelProvider } from "./types.js";
export declare function createProvider(name: string, config: VibeConfig["providers"][string], requestTimeoutMs?: number): ModelProvider;
export declare function createProviderRegistry(config: VibeConfig): Map<string, ModelProvider>;
