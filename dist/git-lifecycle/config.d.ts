import type { VibeConfig } from "../config/schema.js";
export type GitLifecycleConfig = VibeConfig["git_lifecycle"];
export declare function gitLifecycleConfig(config: VibeConfig): GitLifecycleConfig;
