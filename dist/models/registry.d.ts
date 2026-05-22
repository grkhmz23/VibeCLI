import type { VibeConfig } from "../config/schema.js";
import type { ModelInfo } from "../providers/types.js";
import { type ModelCapabilities } from "./capabilities.js";
export declare function getModelCapabilities(args: {
    config: VibeConfig;
    provider: string;
    model: string;
    metadata?: ModelInfo;
}): ModelCapabilities;
