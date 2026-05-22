export type AuditExportFormat = "json" | "markdown" | "csv";
export type AuditControlSeverity = "low" | "medium" | "high" | "critical";
export type AuditControlStatus = "satisfied" | "partial" | "missing" | "not_applicable" | "unknown";
export type AuditGapPriority = "p0" | "p1" | "p2" | "p3";
export type AuditExportMode = "minimal" | "audit" | "forensic_redacted";

export type AuditConfig = {
  enabled: boolean;
  schema_dir: string;
  export_dir: string;
  reviewer_directory_dir: string;
  default_schema: string;
  allow_custom_schemas: boolean;
  require_signed_audit_exports: boolean;
  include_raw_logs_by_default: boolean;
  max_export_bytes: number;
  allowed_export_formats: AuditExportFormat[];
  compliance_language: {
    avoid_certification_claims: boolean;
    use_control_mapping_terms: boolean;
  };
  retention: {
    audit_export_retention_days: number;
    legal_hold: boolean;
  };
};

export type AuditSchema = {
  version: 1;
  name: string;
  title: string;
  description: string;
  disclaimer: string;
  controls: AuditControl[];
};

export type AuditControl = {
  id: string;
  title: string;
  category: AuditControlCategory;
  severity: AuditControlSeverity;
  required: boolean;
  evidenceSources: AuditEvidenceSourceName[];
  checks: Array<{
    id: string;
    description: string;
    artifactHints: string[];
  }>;
};

export type AuditControlCategory =
  | "security"
  | "authentication"
  | "authorization"
  | "secrets"
  | "api-boundary"
  | "cors"
  | "jwt-session"
  | "database-migrations"
  | "dependency-hygiene"
  | "testing"
  | "ci-cd"
  | "observability"
  | "error-handling"
  | "ai-provider-safety"
  | "cost-rate-limits"
  | "release-governance"
  | "provenance"
  | "auditability"
  | "rollback"
  | "organization-approval"
  | "remote-attestation"
  | "retention";

export type AuditEvidenceSourceName =
  | "ledger"
  | "security-policy"
  | "scanner-results"
  | "external-scanner-results"
  | "verification-results"
  | "ci-status"
  | "deployment-readiness"
  | "release-readiness"
  | "provenance"
  | "evidence"
  | "remote-attestation"
  | "transparency"
  | "registry-metadata"
  | "organization-policy"
  | "organization-approval"
  | "retention"
  | "organization-audit"
  | "handoff"
  | "release-packet"
  | "git-lifecycle"
  | "reviewer-feedback"
  | "merge-readiness";

export type AuditEvidenceMap = {
  runId: string;
  createdAt: string;
  schema: {
    name: string;
    title: string;
    version: number;
  };
  disclaimer: string;
  controls: AuditMappedControl[];
  summary: {
    totalControls: number;
    satisfied: number;
    partial: number;
    missing: number;
    notApplicable: number;
    unknown: number;
    criticalMissing: number;
    highMissing: number;
  };
  warnings: string[];
};

export type AuditMappedControl = {
  id: string;
  title: string;
  category: string;
  severity: AuditControlSeverity;
  required: boolean;
  status: AuditControlStatus;
  evidence: AuditEvidenceRef[];
  gaps: string[];
  recommendations: string[];
};

export type AuditEvidenceRef = {
  source: string;
  path: string | null;
  sha256: string | null;
  summary: string;
  redacted: boolean;
};

export type AuditCoverageReport = {
  runId: string;
  createdAt: string;
  schema: string;
  coverage: {
    percentSatisfied: number;
    requiredSatisfied: number;
    requiredTotal: number;
    criticalMissing: number;
    highMissing: number;
  };
  byCategory: Array<{
    category: string;
    total: number;
    satisfied: number;
    partial: number;
    missing: number;
    percentSatisfied: number;
  }>;
  blockingGaps: Array<{
    controlId: string;
    severity: string;
    title: string;
    gaps: string[];
    recommendations: string[];
  }>;
  nextActions: string[];
  disclaimer: string;
};

export type AuditGapsReport = {
  runId: string;
  createdAt: string;
  schema: string;
  gaps: Array<{
    priority: AuditGapPriority;
    controlId: string;
    category: string;
    severity: string;
    title: string;
    whyItMatters: string;
    recommendedEvidence: string[];
    recommendedVibeCommands: string[];
  }>;
  summary: Record<AuditGapPriority, number>;
  disclaimer: string;
};

export type AuditReport = {
  version: 1;
  type: "vibecli.audit.report";
  runId: string;
  createdAt: string;
  schema: string;
  disclaimer: string;
  coverage: object;
  gaps: object;
  controlResults: object[];
  evidenceIndex: object[];
  org: {
    orgId: string | null;
    orgName: string | null;
    policyBundleVerified: boolean | null;
    approvalQuorum: string | null;
  };
  integrity: {
    ledgerVerified: boolean;
    provenanceVerified: boolean | null;
    evidenceVerified: boolean | null;
    orgAuditVerified: boolean | null;
  };
  warnings: string[];
};

export type SignedAuditEnvelope = {
  version: 1;
  type: "vibecli.audit.report-envelope" | "vibecli.compliance.bundle-envelope";
  createdAt: string;
  runId: string;
  reportPath: string;
  reportSha256: string;
  signature: {
    algorithm: "ed25519";
    signatureBase64: string;
    publicKeyFingerprint: string;
    keyType: "organization" | "provenance";
  };
  publicKey: {
    pem: string;
    fingerprint: string;
  };
};

export type ComplianceCheckBundle = {
  version: 1;
  type: "vibecli.compliance.check-bundle";
  runId: string;
  createdAt: string;
  schema: string;
  disclaimer: string;
  includedArtifacts: Array<{
    path: string;
    sha256: string;
    class: string;
  }>;
  coverage: object;
  gaps: object;
  readOnly: true;
  certificationClaim: false;
  warnings: string[];
};

export type ReviewerDirectoryEntry = {
  id: string;
  displayName: string;
  emailHash?: string;
  roles: string[];
  active: boolean;
};

export type ReviewerImportPreview = {
  createdAt: string;
  file: string;
  reviewers: ReviewerDirectoryEntry[];
  toAdd: string[];
  toUpdate: string[];
  toDeactivate: string[];
  duplicates: string[];
  errors: string[];
  rawEmailsHashed: boolean;
};

export type AuditorHandoff = {
  version: 1;
  type: "vibecli.auditor.handoff";
  runId: string;
  createdAt: string;
  schema: string;
  disclaimer: string;
  executiveSummary: string;
  evidenceIndex: object[];
  coverage: object;
  gaps: object;
  signedReports: {
    auditReportSigned: boolean;
    complianceBundleSigned: boolean;
    provenanceSigned: boolean;
    orgPolicySigned: boolean;
  };
  verification: {
    ledgerVerified: boolean;
    auditExportVerified: boolean | null;
    complianceBundleVerified: boolean | null;
    orgAuditVerified: boolean | null;
  };
  reviewerApprovals: object;
  retention: object;
  evidenceLifecycle?: object;
  evidenceDisposal?: object;
  warnings: string[];
};
