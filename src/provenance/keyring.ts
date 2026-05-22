import { chmod, readFile, writeFile } from "node:fs/promises";
import { generateKeyPairSync, createPrivateKey, createPublicKey } from "node:crypto";
import { provenanceKeyPaths } from "./config.js";
import { fingerprintPublicKey } from "./signature.js";
import { ensureDir, pathExists, readJson } from "../utils/fs.js";
import type { KeyMetadata } from "./types.js";

export async function keyStatus(cwd: string): Promise<{
  status: "missing" | "present";
  publicKeyFingerprint: string | null;
  publicKeyPath: string;
  privateKeyPath: string;
}> {
  const paths = await provenanceKeyPaths(cwd);
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

export async function initProvenanceKey(
  cwd: string,
  options: { confirm?: string; rotate?: boolean }
): Promise<KeyMetadata> {
  const expected = options.rotate ? "ROTATE PROVENANCE KEY" : "CREATE PROVENANCE KEY";
  if (options.confirm !== expected) {
    throw new Error(
      `Provenance key ${options.rotate ? "rotation" : "creation"} requires exact confirmation: ${expected}`
    );
  }
  const paths = await provenanceKeyPaths(cwd);
  if (!options.rotate && (pathExists(paths.privateKeyPath) || pathExists(paths.publicKeyPath))) {
    throw new Error(
      "Provenance key already exists; use --rotate with exact confirmation to rotate."
    );
  }
  const previous = pathExists(paths.metadataPath)
    ? await readJson<KeyMetadata>(paths.metadataPath).catch(() => undefined)
    : undefined;
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const privatePem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  const publicPem = publicKey.export({ type: "spki", format: "pem" }).toString();
  await ensureDir(paths.keyDir);
  await writeFile(paths.privateKeyPath, privatePem, { encoding: "utf8", mode: 0o600 });
  await chmod(paths.privateKeyPath, 0o600).catch(() => undefined);
  await writeFile(paths.publicKeyPath, publicPem, "utf8");
  const metadata: KeyMetadata = {
    createdAt: new Date().toISOString(),
    algorithm: "ed25519",
    publicKeyFingerprint: fingerprintPublicKey(publicPem),
    privateKeyPath: paths.privateKeyPath,
    publicKeyPath: paths.publicKeyPath,
    rotatedFrom: previous?.publicKeyFingerprint ?? null
  };
  await writeFile(paths.metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
  return metadata;
}

export async function loadPrivateSigningKey(
  cwd: string
): Promise<ReturnType<typeof createPrivateKey>> {
  const paths = await provenanceKeyPaths(cwd);
  if (!pathExists(paths.privateKeyPath))
    throw new Error("Local provenance private key is missing.");
  return createPrivateKey(await readFile(paths.privateKeyPath, "utf8"));
}

export async function loadPublicSigningKey(cwd: string): Promise<{
  pem: string;
  key: ReturnType<typeof createPublicKey>;
  fingerprint: string;
}> {
  const paths = await provenanceKeyPaths(cwd);
  if (!pathExists(paths.publicKeyPath)) throw new Error("Local provenance public key is missing.");
  const pem = await readFile(paths.publicKeyPath, "utf8");
  return { pem, key: createPublicKey(pem), fingerprint: fingerprintPublicKey(pem) };
}

export async function exportPublicKey(cwd: string): Promise<{
  pem: string;
  fingerprint: string;
}> {
  const publicKey = await loadPublicSigningKey(cwd);
  return { pem: publicKey.pem, fingerprint: publicKey.fingerprint };
}
