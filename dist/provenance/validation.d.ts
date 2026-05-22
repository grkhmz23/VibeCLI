import type { ProvenanceConfig } from "./config.js";
export declare function validateProvenanceConfig(config: ProvenanceConfig): {
    ok: boolean;
    errors: string[];
};
