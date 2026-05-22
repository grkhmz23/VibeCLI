export type TagPlan = {
    runId: string;
    createdAt: string;
    mode: "preview" | "created" | "failed";
    tag: string;
    commitSha: string | null;
    annotated: boolean;
    messagePath: string | null;
    warnings: string[];
    errors: string[];
};
export declare function tagRun(cwd: string, runId: string, options?: {
    create?: boolean;
    deleteLocal?: boolean;
    confirm?: string;
    allowDirty?: boolean;
    allowLedgerWarning?: boolean;
    allowNoReleasePacket?: boolean;
}): Promise<TagPlan>;
