export type CommandClassification = "allowed" | "requires_approval" | "denied";
export type CommandReviewEntry = {
    agent: string;
    command: string;
    classification: CommandClassification;
    reason: string;
};
export declare function classifyCommand(command: string): {
    classification: CommandClassification;
    reason: string;
};
export declare function collectCommandRecommendations(outputs: Record<string, unknown>): CommandReviewEntry[];
