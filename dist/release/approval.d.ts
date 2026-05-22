import { type ApprovalNote } from "../approvals/notes.js";
export declare function addReleaseApproval(cwd: string, runId: string, args: {
    decision?: "approved" | "rejected" | "needs_changes";
    reviewer?: string;
    note?: string;
    confirm?: string;
}): Promise<ApprovalNote[]>;
