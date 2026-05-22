export type ApprovalNote = {
    id: string;
    runId: string;
    createdAt: string;
    type: "review" | "apply" | "exception" | "release" | "rollback";
    decision: "approved" | "rejected" | "needs_changes";
    reviewer: string;
    note: string;
    artifactHashes: Array<{
        path: string;
        sha256: string;
    }>;
    signature: {
        algorithm: "sha256-local";
        payloadHash: string;
    };
};
export declare function readApprovalNotes(cwd: string, runId: string): Promise<ApprovalNote[]>;
export declare function addApprovalNote(cwd: string, runId: string, args: {
    type: ApprovalNote["type"];
    decision: ApprovalNote["decision"];
    reviewer: string;
    note: string;
    confirm?: string;
}): Promise<ApprovalNote>;
export declare function renderApprovalNotes(notes: ApprovalNote[]): string;
export declare function verifyApprovalNotes(cwd: string, runId: string): Promise<{
    runId: string;
    ok: boolean;
    notes: Array<{
        id: string;
        ok: boolean;
        reason: string;
    }>;
}>;
