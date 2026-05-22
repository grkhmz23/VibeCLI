import type { DisposalAttestation } from "./types.js";
export declare function createDisposalAttestation(cwd: string, runId: string, options?: {
    sign?: boolean;
    confirm?: string;
}): Promise<DisposalAttestation>;
