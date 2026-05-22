import { loadConfig } from "../config/config.js";
import type { VibeConfig } from "../config/schema.js";

export type RemoteAttestationConfig = VibeConfig["remote_attestation"];

export async function loadRemoteAttestationConfig(cwd: string): Promise<RemoteAttestationConfig> {
  return (await loadConfig(cwd)).remote_attestation;
}
