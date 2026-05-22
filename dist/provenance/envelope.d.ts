import type { ProvenanceEnvelope, ProvenanceStatement } from "./types.js";
export declare function signProvenance(cwd: string, runId: string, options: {
    confirm?: string;
}): Promise<ProvenanceEnvelope>;
export type { ProvenanceStatement };
