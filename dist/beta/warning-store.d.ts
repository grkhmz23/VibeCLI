import type { BetaWarningRecord } from "./types.js";
export type BetaWarningAcceptances = {
    updatedAt: string;
    warnings: Record<string, {
        status: "accepted" | "resolved";
        by: string;
        reason: string;
        at: string;
    }>;
};
export declare const acceptancesPath = ".vibecli/beta/reports/BETA_WARNING_ACCEPTANCES.json";
export declare function readWarningAcceptances(cwd: string): Promise<BetaWarningAcceptances>;
export declare function writeWarningAcceptances(cwd: string, acceptances: BetaWarningAcceptances): Promise<void>;
export declare function applyAcceptances(warnings: BetaWarningRecord[], acceptances: BetaWarningAcceptances): BetaWarningRecord[];
