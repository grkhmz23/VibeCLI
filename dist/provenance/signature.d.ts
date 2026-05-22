import { type KeyObject } from "node:crypto";
export declare function sha256Text(value: string | Buffer): string;
export declare function fingerprintPublicKey(publicKeyPem: string): string;
export declare function canonicalJson(value: unknown): string;
export declare function signCanonicalJson(value: unknown, privateKey: KeyObject): string;
export declare function verifyCanonicalJson(value: unknown, signatureBase64: string, publicKey: KeyObject): boolean;
