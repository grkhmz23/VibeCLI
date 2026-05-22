import type { DisposalConfig } from "./types.js";
export declare const defaultDisposalConfig: DisposalConfig;
export declare function loadDisposalConfig(cwd: string): Promise<DisposalConfig>;
export declare function disposalPaths(cwd: string): Promise<{
    disposalDir: string;
}>;
