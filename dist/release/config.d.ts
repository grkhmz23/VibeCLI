import type { VibeConfig } from "../config/schema.js";
export type ReleaseConfig = VibeConfig["release"];
export declare function loadReleaseConfig(cwd: string): Promise<ReleaseConfig>;
export declare function resolveReleaseChannel(config: ReleaseConfig, channel?: string): string;
