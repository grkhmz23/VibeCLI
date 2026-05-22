import type { VibeConfig } from "../config/schema.js";

export type GitLifecycleConfig = VibeConfig["git_lifecycle"];

export function gitLifecycleConfig(config: VibeConfig): GitLifecycleConfig {
  return config.git_lifecycle;
}
