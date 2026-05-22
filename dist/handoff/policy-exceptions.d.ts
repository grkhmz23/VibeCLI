export type PolicyException = {
    id: string;
    policy: string;
    severity: "low" | "medium" | "high" | "critical";
    status: "requested" | "approved" | "rejected";
    reason: string;
    risk: string;
    mitigation: string;
    requestedBy: string | null;
    approvedBy: string | null;
    createdAt: string;
    updatedAt: string;
};
export type PolicyExceptionsFile = {
    runId: string;
    createdAt: string;
    exceptions: PolicyException[];
};
export declare function readPolicyExceptions(cwd: string, runId: string): Promise<PolicyExceptionsFile>;
export declare function renderPolicyExceptions(value: PolicyExceptionsFile): string;
export declare function writePolicyExceptions(cwd: string, value: PolicyExceptionsFile): Promise<void>;
