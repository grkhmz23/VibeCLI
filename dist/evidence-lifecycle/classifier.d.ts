import type { EvidenceClass, EvidenceInventoryFile } from "./types.js";
export declare function classifyEvidencePath(path: string): EvidenceClass;
export declare function classifySensitivity(path: string, contentSample: string): Pick<EvidenceInventoryFile, "sensitivity" | "excluded" | "exclusionReason" | "warnings">;
export declare function recommendedRetention(evidenceClass: EvidenceClass): "short" | "standard" | "long" | "legal_hold";
