import type { RemoteAttestationConfig, RemoteAttestationTarget } from "./types.js";
export declare function validateTargetName(name: string): void;
export declare function validateRemoteTarget(name: string, target: RemoteAttestationTarget, config: Pick<RemoteAttestationConfig, "allow_localhost_targets" | "require_https_targets">): string[];
export declare function validateRemoteAttestationConfig(config: RemoteAttestationConfig): string[];
export declare function isLocalhost(hostname: string): boolean;
