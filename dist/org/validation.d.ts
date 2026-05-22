import type { OrganizationConfig } from "./types.js";
export declare function isSafeOrgToken(value: string): boolean;
export declare function looksSecret(value: unknown): boolean;
export declare function redactOrgText(value: string): string;
export declare function validateOrganizationConfig(config: OrganizationConfig): string[];
export declare function assertValidOrganizationConfig(config: OrganizationConfig): void;
