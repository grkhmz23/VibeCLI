import type { OrgAuditChainEntry, OrgAuditEvent } from "./types.js";
export declare function appendOrgAuditEvent(cwd: string, event: Omit<OrgAuditEvent, "version" | "createdAt">): Promise<OrgAuditChainEntry>;
export declare function readOrgAudit(cwd: string): Promise<{
    events: OrgAuditEvent[];
    chain: OrgAuditChainEntry[];
}>;
export declare function verifyOrgAuditLog(cwd: string): Promise<{
    ok: boolean;
    eventCount: number;
    latestChainHash: string | null;
    errors: string[];
}>;
