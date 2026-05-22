import type { CiStatus } from "./types.js";
export declare function readCiStatus(cwd: string, runId: string): Promise<CiStatus | undefined>;
export declare function showOrCreateLocalCiStatus(cwd: string, runId: string): Promise<CiStatus>;
export declare function ingestGithubCi(cwd: string, runId: string, confirm?: string): Promise<CiStatus>;
export declare function ingestCiFile(cwd: string, runId: string, file: string): Promise<CiStatus>;
export declare function renderCiStatus(status: CiStatus): string;
