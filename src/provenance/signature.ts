import { createHash, sign, verify, type KeyObject } from "node:crypto";

export function sha256Text(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

export function fingerprintPublicKey(publicKeyPem: string): string {
  return sha256Text(publicKeyPem).slice(0, 32);
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, sortValue(entry)])
    );
  }
  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

export function signCanonicalJson(value: unknown, privateKey: KeyObject): string {
  return sign(null, Buffer.from(canonicalJson(value), "utf8"), privateKey).toString("base64");
}

export function verifyCanonicalJson(
  value: unknown,
  signatureBase64: string,
  publicKey: KeyObject
): boolean {
  return verify(
    null,
    Buffer.from(canonicalJson(value), "utf8"),
    publicKey,
    Buffer.from(signatureBase64, "base64")
  );
}
