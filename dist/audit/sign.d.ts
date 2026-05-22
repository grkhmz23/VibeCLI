import { type KeyObject } from "node:crypto";
import type { SignedAuditEnvelope } from "./types.js";
export declare function chooseAuditSigningKey(cwd: string): Promise<{
    keyType: "organization" | "provenance";
    privateKey: KeyObject;
    publicPem: string;
    publicFingerprint: string;
}>;
export declare function makeSignedAuditEnvelope(runId: string, type: SignedAuditEnvelope["type"], reportPath: string, report: unknown, key: Awaited<ReturnType<typeof chooseAuditSigningKey>>): SignedAuditEnvelope;
export declare function verifySignedAuditEnvelope(envelope: SignedAuditEnvelope, reportPath: string): Promise<{
    ok: boolean;
    message: string;
}>;
