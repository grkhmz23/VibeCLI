import type { BetaChannel } from "./types.js";
type Gate = {
    name: string;
    category: "build" | "tests" | "dogfood" | "security" | "package" | "docs" | "performance" | "providers" | "scanners" | "ux";
    status: "passed" | "warning" | "failed" | "not_run" | "accepted_warning";
    blocking: boolean;
    evidencePath: string | null;
    message: string;
};
export type BetaRcReport = {
    createdAt: string;
    channel: BetaChannel;
    verdict: "beta_rc_ready" | "ready_with_accepted_warnings" | "blocked";
    gates: Gate[];
    acceptedWarnings: Array<{
        id: string;
        source: string;
        acceptedBy: string;
        acceptanceReason: string;
    }>;
    blockers: string[];
    warnings: string[];
    manualValidationRequired: string[];
    nextActions: string[];
};
export declare function createBetaRcReport(cwd: string, options?: {
    channel?: BetaChannel;
    strict?: boolean;
}): Promise<BetaRcReport>;
export {};
