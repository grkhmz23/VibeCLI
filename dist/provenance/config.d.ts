import type { VibeConfig } from "../config/schema.js";
export type ProvenanceConfig = VibeConfig["provenance"];
export declare function loadProvenanceConfig(cwd: string): Promise<ProvenanceConfig>;
export declare function provenanceKeyPaths(cwd: string): Promise<{
    keyDir: string;
    privateKeyPath: string;
    publicKeyPath: string;
    metadataPath: string;
}>;
