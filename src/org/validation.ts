import { resolve } from "node:path";
import type { OrganizationConfig } from "./types.js";

const safeToken = /^[a-z0-9][a-z0-9_-]*$/;
const secretPatterns = [
  /sk-[A-Za-z0-9_-]{12,}/,
  /gh[pousr]_[A-Za-z0-9_]{12,}/,
  /bearer\s+[A-Za-z0-9._-]{12,}/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /^[A-Za-z0-9_-]{32,}$/,
  /^[a-z][a-z0-9+.-]*:\/\/[^/\s:]+:[^@\s]+@/i
];

export function isSafeOrgToken(value: string): boolean {
  return safeToken.test(value);
}

export function looksSecret(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return secretPatterns.some((pattern) => pattern.test(value));
}

export function redactOrgText(value: string): string {
  return secretPatterns.reduce((text, pattern) => text.replace(pattern, "[REDACTED]"), value);
}

function hasControlCharacters(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code < 32;
  });
}

export function validateOrganizationConfig(config: OrganizationConfig): string[] {
  const errors: string[] = [];
  if (!isSafeOrgToken(config.org_id)) errors.push("organization.org_id must be a safe token.");
  if (config.org_name.length > 120 || hasControlCharacters(config.org_name)) {
    errors.push("organization.org_name must be bounded and cannot contain control characters.");
  }
  if (looksSecret(config.org_name)) errors.push("organization.org_name looks like a secret.");
  for (const [field, value] of [
    ["key_dir", config.key_dir],
    ["policy_bundle_dir", config.policy_bundle_dir],
    ["audit_log_dir", config.audit_log_dir]
  ] as const) {
    const resolved = resolve(value);
    if (!resolved.includes(`${resolve(".vibecli/org")}`)) {
      errors.push(`organization.${field} must resolve under .vibecli/org.`);
    }
  }
  for (const reviewer of config.reviewers) {
    if (!isSafeOrgToken(reviewer.id)) errors.push(`Reviewer id ${reviewer.id} is unsafe.`);
    if (reviewer.display_name.length > 120 || hasControlCharacters(reviewer.display_name)) {
      errors.push(`Reviewer ${reviewer.id} display name is invalid.`);
    }
    if (looksSecret(reviewer.display_name))
      errors.push(`Reviewer ${reviewer.id} display name looks like a secret.`);
    for (const role of reviewer.roles) {
      if (!isSafeOrgToken(role)) errors.push(`Reviewer role ${role} is unsafe.`);
    }
  }
  for (const [name, policy] of Object.entries(config.approval_policies)) {
    if (!isSafeOrgToken(name)) errors.push(`Approval policy ${name} is unsafe.`);
    if (!Number.isInteger(policy.min_approvals) || policy.min_approvals <= 0) {
      errors.push(`Approval policy ${name} min_approvals must be positive.`);
    }
    if (policy.min_approvals > 0 && policy.required_roles.length === 0) {
      errors.push(`Approval policy ${name} requires roles when approvals are required.`);
    }
    for (const role of policy.required_roles) {
      if (!isSafeOrgToken(role)) errors.push(`Approval policy role ${role} is unsafe.`);
    }
    if (name === "strict-enterprise-release" && !policy.require_distinct_reviewers) {
      errors.push("strict-enterprise-release must require distinct reviewers.");
    }
  }
  if (!config.approval_policies[config.default_approval_policy]) {
    errors.push("organization.default_approval_policy must exist.");
  }
  for (const [name, policy] of Object.entries(config.retention.policies)) {
    if (!isSafeOrgToken(name)) errors.push(`Retention policy ${name} is unsafe.`);
    if (
      policy.retention_days !== null &&
      (!Number.isInteger(policy.retention_days) || policy.retention_days <= 0)
    ) {
      errors.push(`Retention policy ${name} retention_days must be positive.`);
    }
    if (policy.retention_days === null && !policy.legal_hold) {
      errors.push(`Retention policy ${name} can use null retention only with legal hold.`);
    }
    if (!["minimal", "audit", "forensic_redacted"].includes(policy.export_mode)) {
      errors.push(`Retention policy ${name} export_mode is invalid.`);
    }
  }
  if (!config.retention.policies[config.retention.default_policy]) {
    errors.push("organization.retention.default_policy must exist.");
  }
  if (containsSecret(config)) errors.push("organization config contains a secret-looking value.");
  return errors;
}

export function assertValidOrganizationConfig(config: OrganizationConfig): void {
  const errors = validateOrganizationConfig(config);
  if (errors.length) throw new Error(errors.join("; "));
}

function containsSecret(value: unknown): boolean {
  if (looksSecret(value)) return true;
  if (Array.isArray(value)) return value.some(containsSecret);
  if (typeof value === "object" && value !== null) {
    return Object.values(value).some(containsSecret);
  }
  return false;
}
