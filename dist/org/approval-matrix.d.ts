import type { OrgApprovalDecision, OrgApprovalMatrix } from "./types.js";
export declare function getApprovalMatrix(cwd: string, runId: string, options?: {
    write?: boolean;
}): Promise<OrgApprovalMatrix>;
export declare function addOrgApproval(cwd: string, runId: string, options: {
    reviewer: string;
    role: string;
    decision: OrgApprovalDecision;
    note: string;
    confirm?: string;
    externalReviewer?: boolean;
}): Promise<OrgApprovalMatrix>;
export declare function computeQuorum(matrix: OrgApprovalMatrix): OrgApprovalMatrix["quorum"];
export declare function verifyApprovalMatrix(cwd: string, runId: string): Promise<{
    ok: boolean;
    checks: Array<{
        name: string;
        ok: boolean;
        message: string;
    }>;
}>;
export declare function readApprovalMatrixNoteHashes(cwd: string, runId: string): Promise<string[]>;
