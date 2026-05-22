export type GithubReleaseDraft = {
    runId: string;
    createdAt: string;
    mode: "preview" | "draft_created" | "failed";
    tag: string | null;
    title: string;
    notesPath: string;
    channel: string | null;
    releaseReadiness: string | null;
    localTagExists: boolean;
    remoteTagExists: boolean | null;
    draftUrl: string | null;
    warnings: string[];
    errors: string[];
};
export declare function githubReleaseDraft(cwd: string, runId: string, options?: {
    checkRemoteTag?: boolean;
    createDraft?: boolean;
    updateDraft?: boolean;
    tag?: string;
    confirm?: string;
    allowUnsignedProvenance?: boolean;
    allowLedgerWarning?: boolean;
    allowBlocked?: boolean;
}): Promise<GithubReleaseDraft>;
