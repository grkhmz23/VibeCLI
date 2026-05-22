export declare function orgStatus(cwd: string): Promise<{
    enabled: boolean;
    orgId: string;
    orgName: string;
    requireSignedPolicyBundle: boolean;
    approvalPolicies: string[];
    reviewerCount: number;
    roles: Record<string, number>;
    auditLog: {
        events: number;
        latestChainHash: string | null;
    };
    key: {
        status: "missing" | "present";
        publicKeyFingerprint: string | null;
    };
}>;
export declare function initOrganization(cwd: string, options: {
    confirm?: string;
    noEnable?: boolean;
    force?: boolean;
    createKey?: boolean;
}): Promise<Awaited<ReturnType<typeof orgStatus>>>;
export declare function listOrgReviewers(cwd: string): Promise<Array<{
    id: string;
    displayName: string;
    roles: string[];
}>>;
export declare function orgAuditSummary(cwd: string, verify?: boolean): Promise<{
    ok?: boolean;
    eventCount: number;
    latestChainHash: string | null;
    errors: string[];
}>;
