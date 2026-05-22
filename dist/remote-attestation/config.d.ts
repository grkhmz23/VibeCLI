import type { VibeConfig } from "../config/schema.js";
export type RemoteAttestationConfig = VibeConfig["remote_attestation"];
export declare function loadRemoteAttestationConfig(cwd: string): Promise<RemoteAttestationConfig>;
