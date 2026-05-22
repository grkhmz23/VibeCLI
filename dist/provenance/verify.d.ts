import type { ProvenanceVerificationResult } from "./types.js";
export declare function verifyProvenance(cwd: string, runId: string): Promise<ProvenanceVerificationResult>;
