import type { RegistryMetadata } from "./types.js";
export declare function generateRegistryMetadata(cwd: string, runId: string, options?: {
    image?: string;
    tag?: string;
}): Promise<RegistryMetadata>;
