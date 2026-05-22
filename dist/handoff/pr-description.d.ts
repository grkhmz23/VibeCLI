import type { HandoffSummary } from "./types.js";
export type PrDescription = {
    runId: string;
    path: string;
    title: string;
    body: string;
};
export declare function generatePrDescription(cwd: string, runId: string, summary?: HandoffSummary): Promise<PrDescription>;
