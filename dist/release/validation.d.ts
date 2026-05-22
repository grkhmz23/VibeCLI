import type { ReleaseConfig } from "./config.js";
export declare function validateReleaseConfig(config: ReleaseConfig): {
    ok: boolean;
    errors: string[];
};
export declare function assertSafeTagName(tag: string): void;
