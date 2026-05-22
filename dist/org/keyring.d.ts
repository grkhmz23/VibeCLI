import { createPrivateKey, createPublicKey } from "node:crypto";
import type { OrgKeyMetadata } from "./types.js";
export declare function orgKeyStatus(cwd: string): Promise<{
    status: "missing" | "present";
    publicKeyFingerprint: string | null;
    publicKeyPath: string;
    privateKeyPath: string;
}>;
export declare function initOrgKey(cwd: string, options: {
    confirm?: string;
    rotate?: boolean;
}): Promise<OrgKeyMetadata>;
export declare function loadOrgPrivateKey(cwd: string): Promise<ReturnType<typeof createPrivateKey>>;
export declare function loadOrgPublicKey(cwd: string): Promise<{
    pem: string;
    key: ReturnType<typeof createPublicKey>;
    fingerprint: string;
}>;
export declare function exportOrgPublicKey(cwd: string): Promise<{
    pem: string;
    fingerprint: string;
}>;
