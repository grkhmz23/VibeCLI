export type CostEstimate = {
    runId: string;
    createdAt: string;
    known: boolean;
    estimatedUsd: number | null;
    currency: "USD";
    entries: Array<{
        agent: string;
        provider: string;
        model: string;
        promptTokens: number | null;
        completionTokens: number | null;
        totalTokens: number | null;
        estimatedUsd: number | null;
        pricingSource: "openrouter-models" | "config" | "unknown";
    }>;
    budget: {
        maxRunCostUsd: number | null;
        exceeded: boolean;
        status?: string;
    };
};
export declare function estimateRunCost(cwd: string, runId: string): Promise<CostEstimate>;
