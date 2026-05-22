import { createPrivateKey, createPublicKey } from "node:crypto";
import type { KeyMetadata } from "./types.js";
export declare function keyStatus(cwd: string): Promise<{
    status: "missing" | "present";
    publicKeyFingerprint: string | null;
    publicKeyPath: string;
    privateKeyPath: string;
}>;
export declare function initProvenanceKey(cwd: string, options: {
    confirm?: string;
    rotate?: boolean;
}): Promise<KeyMetadata>;
export declare function loadPrivateSigningKey(cwd: string): Promise<ReturnType<typeof createPrivateKey>>;
export declare function loadPublicSigningKey(cwd: string): Promise<{
    pem: string;
    key: ReturnType<typeof createPublicKey>;
    fingerprint: string;
}>;
export declare function exportPublicKey(cwd: string): Promise<{
    pem: string;
    fingerprint: string;
}>;
