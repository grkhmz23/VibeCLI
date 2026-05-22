import type { BetaState } from "./types.js";
export declare const betaStatePath = ".vibecli/beta/BETA_STATE.json";
export declare function defaultBetaState(): BetaState;
export declare function readBetaState(cwd: string): Promise<BetaState>;
export declare function updateBetaState(cwd: string, update: Omit<Partial<BetaState>, "latestReports"> & {
    latestReports?: Partial<BetaState["latestReports"]>;
}): Promise<BetaState>;
