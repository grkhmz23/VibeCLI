import { chmod, readFile, writeFile } from "node:fs/promises";
import { createPrivateKey, createPublicKey, generateKeyPairSync } from "node:crypto";
import { orgPaths } from "./config.js";
import { fingerprintPublicKey } from "./signature.js";
import { appendOrgAuditEvent } from "./audit-log.js";
import { ensureDir, pathExists, readJson } from "../utils/fs.js";
import type { OrgKeyMetadata } from "./types.js";

export async function orgKeyStatus(cwd: string): Promise<{
  status: "missing" | "present";
  publicKeyFingerprint: string | null;
  publicKeyPath: string;
  privateKeyPath: string;
}> {
  const paths = await orgPaths(cwd);
  if (!pathExists(paths.privateKeyPath) || !pathExists(paths.publicKeyPath)) {
    return {
      status: "missing",
      publicKeyFingerprint: null,
      publicKeyPath: paths.publicKeyPath,
      privateKeyPath: paths.privateKeyPath
    };
  }
  const publicKey = await readFile(paths.publicKeyPath, "utf8");
  return {
    status: "present",
    publicKeyFingerprint: fingerprintPublicKey(publicKey),
    publicKeyPath: paths.publicKeyPath,
    privateKeyPath: paths.privateKeyPath
  };
}

export async function initOrgKey(
  cwd: string,
  options: { confirm?: string; rotate?: boolean }
): Promise<OrgKeyMetadata> {
  const expected = options.rotate ? "ROTATE ORG KEY" : "CREATE ORG KEY";
  if (options.confirm !== expected) {
    throw new Error(
      `Org key ${options.rotate ? "rotation" : "creation"} requires exact confirmation: ${expected}`
    );
  }
  const paths = await orgPaths(cwd);
  if (!options.rotate && (pathExists(paths.privateKeyPath) || pathExists(paths.publicKeyPath))) {
    throw new Error(
      "Org signing key already exists; use --rotate with exact confirmation to rotate."
    );
  }
  const previous = pathExists(paths.metadataPath)
    ? await readJson<OrgKeyMetadata>(paths.metadataPath).catch(() => undefined)
    : undefined;
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const privatePem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  const publicPem = publicKey.export({ type: "spki", format: "pem" }).toString();
  await ensureDir(paths.keyDir);
  await writeFile(paths.privateKeyPath, privatePem, { encoding: "utf8", mode: 0o600 });
  await chmod(paths.privateKeyPath, 0o600).catch(() => undefined);
  await writeFile(paths.publicKeyPath, publicPem, "utf8");
  const metadata: OrgKeyMetadata = {
    createdAt: new Date().toISOString(),
    algorithm: "ed25519",
    publicKeyFingerprint: fingerprintPublicKey(publicPem),
    privateKeyPath: paths.privateKeyPath,
    publicKeyPath: paths.publicKeyPath,
    rotatedFrom: previous?.publicKeyFingerprint ?? null
  };
  await writeFile(paths.metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
  await appendOrgAuditEvent(cwd, {
    eventType: options.rotate ? "org.key.rotated" : "org.key.created",
    actor: null,
    runId: null,
    summary: options.rotate
      ? "Organization signing key rotated."
      : "Organization signing key created.",
    artifactHashes: [
      {
        path: ".vibecli/org/keys/org-policy-signing-key.public.pem",
        sha256: metadata.publicKeyFingerprint
      }
    ],
    redacted: true
  }).catch(() => undefined);
  return metadata;
}

export async function loadOrgPrivateKey(cwd: string): Promise<ReturnType<typeof createPrivateKey>> {
  const paths = await orgPaths(cwd);
  if (!pathExists(paths.privateKeyPath))
    throw new Error("Local organization private key is missing.");
  return createPrivateKey(await readFile(paths.privateKeyPath, "utf8"));
}

export async function loadOrgPublicKey(cwd: string): Promise<{
  pem: string;
  key: ReturnType<typeof createPublicKey>;
  fingerprint: string;
}> {
  const paths = await orgPaths(cwd);
  if (!pathExists(paths.publicKeyPath))
    throw new Error("Local organization public key is missing.");
  const pem = await readFile(paths.publicKeyPath, "utf8");
  return { pem, key: createPublicKey(pem), fingerprint: fingerprintPublicKey(pem) };
}

export async function exportOrgPublicKey(
  cwd: string
): Promise<{ pem: string; fingerprint: string }> {
  const publicKey = await loadOrgPublicKey(cwd);
  return { pem: publicKey.pem, fingerprint: publicKey.fingerprint };
}
