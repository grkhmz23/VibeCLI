import type { EvidenceLifecycleConfig } from "./types.js";
export declare const defaultEvidenceLifecycleConfig: EvidenceLifecycleConfig;
export declare function loadEvidenceLifecycleConfig(cwd: string): Promise<EvidenceLifecycleConfig>;
export declare function evidenceLifecyclePaths(cwd: string): Promise<{
    archiveDir: string;
    lifecycleDir: string;
    retentionLedgerDir: string;
}>;
