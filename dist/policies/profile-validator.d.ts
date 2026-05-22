export type PolicyValidationResult = {
    ok: boolean;
    profile?: string;
    errors: string[];
};
export declare function validatePolicyProfile(cwd: string, name: string): Promise<PolicyValidationResult>;
export declare function validatePolicyProfiles(cwd: string, name?: string): Promise<PolicyValidationResult[]>;
