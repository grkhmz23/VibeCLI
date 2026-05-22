import { join, resolve } from "node:path";
import { loadConfig } from "../config/config.js";
import type { VibeConfig } from "../config/schema.js";

export type ProvenanceConfig = VibeConfig["provenance"];

export async function loadProvenanceConfig(cwd: string): Promise<ProvenanceConfig> {
  return (await loadConfig(cwd)).provenance;
}

export async function provenanceKeyPaths(cwd: string): Promise<{
  keyDir: string;
  privateKeyPath: string;
  publicKeyPath: string;
  metadataPath: string;
}> {
  const config = await loadProvenanceConfig(cwd);
  const keyDir = resolve(cwd, config.signing.key_dir);
  return {
    keyDir,
    privateKeyPath: join(keyDir, config.signing.private_key_file),
    publicKeyPath: join(keyDir, config.signing.public_key_file),
    metadataPath: join(keyDir, "key-metadata.json")
  };
}
