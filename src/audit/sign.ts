import { createPublicKey, type KeyObject } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  canonicalJson,
  signCanonicalJson,
  sha256Text,
  verifyCanonicalJson
} from "../provenance/signature.js";
import { keyStatus, loadPrivateSigningKey, loadPublicSigningKey } from "../provenance/keyring.js";
import { loadOrgPrivateKey, loadOrgPublicKey, orgKeyStatus } from "../org/keyring.js";
import type { SignedAuditEnvelope } from "./types.js";

export async function chooseAuditSigningKey(cwd: string): Promise<{
  keyType: "organization" | "provenance";
  privateKey: KeyObject;
  publicPem: string;
  publicFingerprint: string;
}> {
  const org = await orgKeyStatus(cwd).catch(() => undefined);
  if (org?.status === "present") {
    const publicKey = await loadOrgPublicKey(cwd);
    return {
      keyType: "organization",
      privateKey: await loadOrgPrivateKey(cwd),
      publicPem: publicKey.pem,
      publicFingerprint: publicKey.fingerprint
    };
  }
  const provenance = await keyStatus(cwd).catch(() => undefined);
  if (provenance?.status === "present") {
    const publicKey = await loadPublicSigningKey(cwd);
    return {
      keyType: "provenance",
      privateKey: await loadPrivateSigningKey(cwd),
      publicPem: publicKey.pem,
      publicFingerprint: publicKey.fingerprint
    };
  }
  throw new Error("No organization or provenance signing key is available.");
}

export function makeSignedAuditEnvelope(
  runId: string,
  type: SignedAuditEnvelope["type"],
  reportPath: string,
  report: unknown,
  key: Awaited<ReturnType<typeof chooseAuditSigningKey>>
): SignedAuditEnvelope {
  const reportSha256 = sha256Text(canonicalJson(report));
  return {
    version: 1,
    type,
    createdAt: new Date().toISOString(),
    runId,
    reportPath,
    reportSha256,
    signature: {
      algorithm: "ed25519",
      signatureBase64: signCanonicalJson(report, key.privateKey),
      publicKeyFingerprint: key.publicFingerprint,
      keyType: key.keyType
    },
    publicKey: {
      pem: key.publicPem,
      fingerprint: key.publicFingerprint
    }
  };
}

export async function verifySignedAuditEnvelope(
  envelope: SignedAuditEnvelope,
  reportPath: string
): Promise<{ ok: boolean; message: string }> {
  const report = JSON.parse(await readFile(reportPath, "utf8")) as unknown;
  const hashOk = sha256Text(canonicalJson(report)) === envelope.reportSha256;
  const fingerprintOk = envelope.signature.publicKeyFingerprint === envelope.publicKey.fingerprint;
  const signatureOk = verifyCanonicalJson(
    report,
    envelope.signature.signatureBase64,
    createPublicKey(envelope.publicKey.pem)
  );
  return {
    ok: hashOk && fingerprintOk && signatureOk,
    message:
      hashOk && fingerprintOk && signatureOk
        ? "signature verified"
        : "signature verification failed"
  };
}
