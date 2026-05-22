import type { BetaWarningRecord } from "./types.js";
export type BetaWarningsReport = {
    createdAt: string;
    warnings: BetaWarningRecord[];
    summary: {
        open: number;
        accepted: number;
        resolved: number;
        blockingOpen: number;
    };
};
export declare function collectBetaWarnings(cwd: string): Promise<BetaWarningsReport>;
export declare function acceptBetaWarning(cwd: string, id: string, options: {
    by?: string;
    reason?: string;
    confirm?: string;
    strict?: boolean;
    resolve?: boolean;
}): Promise<BetaWarningsReport>;
