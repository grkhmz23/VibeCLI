export type ReviewerFeedback = {
    runId: string;
    createdAt: string;
    source: "github" | "local";
    pr: string | null;
    reviewDecision: string | null;
    comments: Array<{
        author: string | null;
        body: string;
        file: string | null;
        line: number | null;
        severity: "info" | "question" | "change_requested" | "blocking" | "unknown";
    }>;
    checks: Array<{
        name: string;
        status: string;
        conclusion: string | null;
    }>;
    summary: {
        blockingComments: number;
        changeRequests: number;
        failedChecks: number;
        pendingChecks: number;
    };
    nextActions: string[];
};
