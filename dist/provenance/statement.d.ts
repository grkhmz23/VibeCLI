import type { ProvenanceStatement } from "./types.js";
export declare function generateProvenanceStatement(cwd: string, runId: string): Promise<ProvenanceStatement>;
export declare function renderProvenance(statement: ProvenanceStatement): string;
