export type GitHubPrResult = {
    runId: string;
    createdAt: string;
    mode: "dry_summary" | "created" | "updated" | "commented" | "synced" | "push_required" | "failed";
    remote: string | null;
    branch: string | null;
    title: string;
    bodyPath: string;
    prUrl: string | null;
    warnings: string[];
    errors: string[];
};
