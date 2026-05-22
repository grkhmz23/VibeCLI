import { requiredSecurityPolicy } from "../config/defaults.js";

export const securityPolicyBaseline = requiredSecurityPolicy;

export function requiredSecurityCheckNames(): string[] {
  return Object.keys(securityPolicyBaseline);
}
