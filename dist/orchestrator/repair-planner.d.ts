import type { VibeConfig } from "../config/schema.js";
export type RepairPlan = {
    runId: string;
    createdAt: string;
    cycle: number;
    failureSources: Array<"verification" | "scanner" | "security" | "patch_validation" | "provider_output">;
    selectedFixer: {
        provider: string;
        model: string;
        reason: string;
    };
    fallbackFixers: Array<{
        provider: string;
        model: string;
        available: boolean;
        reason: string;
    }>;
    budgetStatus: string;
    strategyNotes: string[];
};
export declare function buildRepairPlan(args: {
    cwd: string;
    runId: string;
    config: VibeConfig;
    profile: string;
    cycle: number;
    write?: boolean;
}): Promise<RepairPlan>;
