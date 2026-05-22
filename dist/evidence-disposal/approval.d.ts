import type { DisposalApprovals } from "./types.js";
export declare function getDisposalApprovals(cwd: string, runId: string): Promise<DisposalApprovals>;
export declare function addDisposalApproval(cwd: string, runId: string, options: {
    reviewer?: string;
    role?: string;
    decision?: "approved" | "rejected" | "needs_changes";
    note?: string;
    confirm?: string;
    externalReviewer?: boolean;
}): Promise<DisposalApprovals>;
export declare function verifyDisposalApprovals(cwd: string, runId: string): Promise<{
    ok: boolean;
    message: string;
    approvals: DisposalApprovals;
}>;
