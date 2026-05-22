import type { VibeConfig } from "../config/schema.js";
export type ResolvedModelRef = {
    provider: string;
    model: string;
    alias?: string;
};
export declare function resolveModelAlias(config: VibeConfig, alias: string): ResolvedModelRef;
