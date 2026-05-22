import type { CommitResult } from "./types.js";
export declare function commitRun(cwd: string, runId: string, options?: {
    create?: boolean;
    confirm?: string;
    allowUnapplied?: boolean;
    allowLedgerWarning?: boolean;
    allowUnverified?: boolean;
    allowRisk?: boolean;
    allowProtectedBranch?: boolean;
    allowDirty?: boolean;
    includeHandoffArtifacts?: boolean;
}): Promise<CommitResult>;
