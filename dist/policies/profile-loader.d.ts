import { type PolicyProfile } from "./profile.js";
export declare const policyProfilesDir: string;
export declare function ensureDefaultPolicyProfiles(cwd: string, force?: boolean): Promise<void>;
export declare function loadPolicyProfile(cwd: string, name: string): Promise<PolicyProfile>;
export declare function listPolicyProfileNames(cwd: string): Promise<string[]>;
