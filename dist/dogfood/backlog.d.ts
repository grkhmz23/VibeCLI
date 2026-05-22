export type BetaBacklog = {
    createdAt: string;
    items: Array<{
        id: string;
        priority: "p0" | "p1" | "p2" | "p3";
        category: string;
        title: string;
        evidence: string[];
        recommendedFix: string;
        blockingBeta: boolean;
    }>;
    summary: {
        p0: number;
        p1: number;
        p2: number;
        p3: number;
        blockingBeta: number;
    };
};
export declare function createBetaBacklog(cwd: string): Promise<BetaBacklog>;
