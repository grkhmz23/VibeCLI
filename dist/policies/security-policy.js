import { requiredSecurityPolicy } from "../config/defaults.js";
export const securityPolicyBaseline = requiredSecurityPolicy;
export function requiredSecurityCheckNames() {
    return Object.keys(securityPolicyBaseline);
}
//# sourceMappingURL=security-policy.js.map