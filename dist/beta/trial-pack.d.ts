export type BetaTrialTarget = "solo-developer" | "startup-team" | "agency" | "security-reviewer" | "custom";
export type BetaTrialSummary = {
    trialId: string;
    createdAt: string;
    targetUser: BetaTrialTarget;
    recommendedWorkflow: string[];
    safetyNotes: string[];
    feedbackQuestions: string[];
    knownLimitations: string[];
};
export declare function createBetaTrialPack(cwd: string, target?: BetaTrialTarget): Promise<BetaTrialSummary>;
export declare function listBetaTrials(cwd: string): Promise<Array<{
    trialId: string;
    path: string;
}>>;
export declare function showBetaTrial(cwd: string, trialId: string): Promise<BetaTrialSummary>;
