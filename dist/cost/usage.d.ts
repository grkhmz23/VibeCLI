export type ModelUsageEntry = {
    agent: string;
    provider: string;
    model: string;
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
};
export declare function readModelUsage(cwd: string, runId: string): Promise<ModelUsageEntry[]>;
