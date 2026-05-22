import { join } from "node:path";
import { loadConfig } from "../config/config.js";
import type { AuditConfig } from "./types.js";

export const defaultAuditConfig: AuditConfig = {
  enabled: true,
  schema_dir: ".vibecli/audit/schemas",
  export_dir: ".vibecli/audit/exports",
  reviewer_directory_dir: ".vibecli/audit/reviewer-directory",
  default_schema: "internal-secure-release",
  allow_custom_schemas: true,
  require_signed_audit_exports: false,
  include_raw_logs_by_default: false,
  max_export_bytes: 5_000_000,
  allowed_export_formats: ["json", "markdown", "csv"],
  compliance_language: {
    avoid_certification_claims: true,
    use_control_mapping_terms: true
  },
  retention: {
    audit_export_retention_days: 2555,
    legal_hold: false
  }
};

export async function loadAuditConfig(cwd: string): Promise<AuditConfig> {
  const config = await loadConfig(cwd);
  return { ...defaultAuditConfig, ...config.audit };
}

export async function auditPaths(cwd: string): Promise<{
  schemaDir: string;
  exportDir: string;
  reviewerDirectoryDir: string;
}> {
  const config = await loadAuditConfig(cwd);
  return {
    schemaDir: join(cwd, config.schema_dir),
    exportDir: join(cwd, config.export_dir),
    reviewerDirectoryDir: join(cwd, config.reviewer_directory_dir)
  };
}
