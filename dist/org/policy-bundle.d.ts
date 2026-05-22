import type { OrgPolicyBundle, OrgPolicyEnvelope } from "./types.js";
export declare function createOrgPolicyBundle(cwd: string, options?: {
    sign?: boolean;
    confirm?: string;
}): Promise<OrgPolicyBundle>;
export declare function signOrgPolicyBundle(cwd: string): Promise<OrgPolicyEnvelope>;
export declare function verifyOrgPolicyBundle(cwd: string): Promise<{
    ok: boolean;
    checks: Array<{
        name: string;
        ok: boolean;
        message: string;
    }>;
    fingerprint: string | null;
}>;
export declare function showOrgPolicyBundle(cwd: string): Promise<OrgPolicyBundle>;
