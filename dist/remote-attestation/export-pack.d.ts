import type { AttestationExport, ExportManifest } from "./types.js";
export declare function createAttestationExport(cwd: string, runId: string): Promise<AttestationExport>;
export declare function writeExportManifest(cwd: string, runId: string): Promise<ExportManifest>;
