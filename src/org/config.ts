import { join, resolve } from "node:path";
import { loadConfig } from "../config/config.js";
import type { OrganizationConfig } from "./types.js";

export const defaultOrganizationConfig: OrganizationConfig = {
  enabled: false,
  org_id: "local-org",
  org_name: "Local Organization",
  policy_bundle_dir: ".vibecli/org/policy-bundles",
  key_dir: ".vibecli/org/keys",
  audit_log_dir: ".vibecli/org/audit",
  require_signed_policy_bundle: false,
  require_multi_reviewer_approval_for_release: false,
  require_remote_receipt_refresh_for_release: false,
  require_retention_plan_for_release: false,
  default_approval_policy: "company-grade-release",
  reviewers: [
    {
      id: "local-reviewer",
      display_name: "Local Reviewer",
      roles: ["owner", "release_manager"]
    }
  ],
  approval_policies: {
    "company-grade-release": {
      min_approvals: 1,
      required_roles: ["release_manager"],
      disallow_self_approval: false,
      require_distinct_reviewers: true,
      allow_needs_changes: false
    },
    "strict-enterprise-release": {
      min_approvals: 2,
      required_roles: ["security", "release_manager"],
      disallow_self_approval: true,
      require_distinct_reviewers: true,
      allow_needs_changes: false
    }
  },
  retention: {
    default_policy: "standard",
    policies: {
      standard: { retention_days: 365, legal_hold: false, export_mode: "audit" },
      production: { retention_days: 2555, legal_hold: false, export_mode: "audit" },
      "legal-hold": {
        retention_days: null,
        legal_hold: true,
        export_mode: "forensic_redacted"
      }
    }
  }
};

export async function loadOrganizationConfig(cwd: string): Promise<OrganizationConfig> {
  return (await loadConfig(cwd)).organization;
}

export async function orgPaths(cwd: string): Promise<{
  orgRoot: string;
  keyDir: string;
  privateKeyPath: string;
  publicKeyPath: string;
  metadataPath: string;
  policyBundleDir: string;
  latestPolicyBundleDir: string;
  auditLogDir: string;
  exportsDir: string;
}> {
  const org = await loadOrganizationConfig(cwd);
  const keyDir = resolve(cwd, org.key_dir);
  const policyBundleDir = resolve(cwd, org.policy_bundle_dir);
  const auditLogDir = resolve(cwd, org.audit_log_dir);
  return {
    orgRoot: join(cwd, ".vibecli", "org"),
    keyDir,
    privateKeyPath: join(keyDir, "org-policy-signing-key.private.pem"),
    publicKeyPath: join(keyDir, "org-policy-signing-key.public.pem"),
    metadataPath: join(keyDir, "org-key-metadata.json"),
    policyBundleDir,
    latestPolicyBundleDir: join(policyBundleDir, "latest"),
    auditLogDir,
    exportsDir: join(cwd, ".vibecli", "org", "exports")
  };
}
