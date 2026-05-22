import type { PatchProposal } from "../agents/contracts.js";
import type { RunStore } from "./run-store.js";
export type PatchManifestEntry = {
    agent: "implementation" | "test" | "fixer";
    path: string;
    operation: "create" | "modify" | "delete";
    artifactPath: string;
    rationale: string;
    applied: boolean;
    repairCycle?: number;
};
export type PatchManifest = {
    runId: string;
    createdAt: string;
    patches: PatchManifestEntry[];
};
export declare function validatePatchPath(path: string): void;
export declare function collectPatchProposals(outputs: Record<string, unknown>): Array<{
    agent: "implementation" | "test" | "fixer";
    patch: PatchProposal;
}>;
export declare function writePatchArtifacts(args: {
    store: RunStore;
    runId: string;
    createdAt: string;
    outputs: Record<string, unknown>;
}): Promise<PatchManifest>;
