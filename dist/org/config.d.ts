import type { OrganizationConfig } from "./types.js";
export declare const defaultOrganizationConfig: OrganizationConfig;
export declare function loadOrganizationConfig(cwd: string): Promise<OrganizationConfig>;
export declare function orgPaths(cwd: string): Promise<{
    orgRoot: string;
    keyDir: string;
    privateKeyPath: string;
    publicKeyPath: string;
    metadataPath: string;
    policyBundleDir: string;
    latestPolicyBundleDir: string;
    auditLogDir: string;
    exportsDir: string;
}>;
