import type { EvidenceArchiveManifest, EvidenceArchiveMode } from "./types.js";
export declare function previewEvidenceArchive(cwd: string, runId: string, options?: {
    mode?: EvidenceArchiveMode | "forensic-redacted";
    json?: boolean;
}): Promise<{
    runId: string;
    mode: EvidenceArchiveMode;
    files: number;
    excluded: number;
}>;
export declare function createEvidenceArchive(cwd: string, runId: string, options?: {
    mode?: EvidenceArchiveMode | "forensic-redacted";
    create?: boolean;
    confirm?: string;
    sign?: boolean;
    allowLedgerWarning?: boolean;
    allowMissingRetention?: boolean;
}): Promise<EvidenceArchiveManifest>;
export declare function readArchiveManifest(cwd: string, runId: string): Promise<EvidenceArchiveManifest>;
