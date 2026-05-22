import type { VibeConfig } from "./schema.js";
export type ConfigValidationResult = {
    ok: boolean;
    errors: string[];
    warnings: string[];
};
export declare function validateTeamConfig(cwd: string, config: VibeConfig): Promise<ConfigValidationResult>;
