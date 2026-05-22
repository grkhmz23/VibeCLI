import type { RunState } from "../orchestrator/state.js";
import type { Theme } from "./theme.js";
export type HeaderInfo = {
    repoPath: string;
    profile: string;
    policy?: string;
    routingStrategy?: string;
    budgetSummary?: string;
    configStatus: string;
    providers: Array<{
        name: string;
        status: "configured" | "missing_env";
        message: string;
    }>;
    branch: string | null;
    latestRun?: RunState;
    dogfood?: {
        latestBetaVerdict: string;
        latestDogfoodRunId: string | null;
    };
    beta?: {
        latestBetaVerdict: string;
        latestRcReport: string | null;
        blockers: number;
        warnings: number;
        acceptedWarnings: number;
    };
};
export declare function renderLogo(theme: Theme): string;
export declare function renderSafetyBanner(theme: Theme, columns?: number): string;
export declare function renderHeader(info: HeaderInfo, theme: Theme, columns?: number): string;
export declare function renderInputFrame(theme: Theme, columns?: number): string;
export declare function renderAgentStatusBoard(state: RunState | undefined, theme: Theme): string;
export declare function renderRunSummary(state: RunState, theme: Theme): string;
export declare function renderHelp(): string;
export declare function renderReviewSummary(value: string): string;
export declare function renderCommandResult(value: string, theme: Theme): string;
export declare function renderError(error: unknown, theme: Theme): string;
