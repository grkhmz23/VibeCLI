import { loadConfig } from "../config/config.js";
import type { VibeConfig } from "../config/schema.js";

export type ReleaseConfig = VibeConfig["release"];

export async function loadReleaseConfig(cwd: string): Promise<ReleaseConfig> {
  return (await loadConfig(cwd)).release;
}

export function resolveReleaseChannel(config: ReleaseConfig, channel?: string): string {
  const selected = channel ?? config.default_channel;
  if (!config.allowed_channels.includes(selected)) {
    throw new Error(`Release channel ${selected} is not allowed`);
  }
  return selected;
}
