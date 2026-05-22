export type OrganizationReviewer = {
  id: string;
  display_name: string;
  roles: string[];
};

export type OrganizationApprovalPolicy = {
  min_approvals: number;
  required_roles: string[];
  disallow_self_approval: boolean;
  require_distinct_reviewers: boolean;
  allow_needs_changes: boolean;
};

export type OrganizationRetentionPolicy = {
  retention_days: number | null;
  legal_hold: boolean;
  export_mode: "minimal" | "audit" | "forensic_redacted";
};

export type OrganizationConfig = {
  enabled: boolean;
  org_id: string;
  org_name: string;
  policy_bundle_dir: string;
  key_dir: string;
  audit_log_dir: string;
  require_signed_policy_bundle: boolean;
  require_multi_reviewer_approval_for_release: boolean;
  require_remote_receipt_refresh_for_release: boolean;
  require_retention_plan_for_release: boolean;
  default_approval_policy: string;
  reviewers: OrganizationReviewer[];
  approval_policies: Record<string, OrganizationApprovalPolicy>;
  retention: {
    default_policy: string;
    policies: Record<string, OrganizationRetentionPolicy>;
  };
};

export type OrgKeyMetadata = {
  createdAt: string;
  algorithm: "ed25519";
  publicKeyFingerprint: string;
  privateKeyPath: string;
  publicKeyPath: string;
  rotatedFrom: string | null;
};

export type OrgAuditEvent = {
  version: 1;
  createdAt: string;
  eventType: string;
  actor: string | null;
  runId: string | null;
  summary: string;
  artifactHashes: Array<{ path: string; sha256: string }>;
  redacted: boolean;
};

export type OrgAuditChainEntry = {
  index: number;
  createdAt: string;
  eventHash: string;
  previousChainHash: string | null;
  chainHash: string;
};

export type OrgPolicyBundle = {
  version: 1;
  type: "vibecli.organization.policy-bundle";
  createdAt: string;
  org: { orgId: string; orgName: string };
  configHash: string;
  policyProfiles: Array<{ name: string; sha256: string }>;
  approvalPolicies: Array<{
    name: string;
    minApprovals: number;
    requiredRoles: string[];
    requireDistinctReviewers: boolean;
  }>;
  retentionPolicies: Array<{
    name: string;
    retentionDays: number | null;
    legalHold: boolean;
    exportMode: string;
  }>;
  securityBaseline: { requiredChecks: string[] };
  remoteAttestation: {
    allowRemoteSubmission: boolean;
    metadataOnlyDefault: boolean;
    requireHttpsTargets: boolean;
  };
  warnings: string[];
};

export type OrgPolicyManifest = {
  createdAt: string;
  algorithm: "sha256";
  files: Array<{ path: string; sha256: string; sizeBytes: number }>;
  manifestHash: string;
};

export type OrgPolicyEnvelope = {
  version: 1;
  type: "vibecli.organization.policy-envelope";
  createdAt: string;
  bundlePath: string;
  bundleSha256: string;
  signature: {
    algorithm: "ed25519";
    signatureBase64: string;
    publicKeyFingerprint: string;
  };
  publicKey: {
    pem: string;
    fingerprint: string;
  };
};

export type OrgApprovalDecision = "approved" | "rejected" | "needs_changes";

export type OrgApprovalMatrix = {
  runId: string;
  createdAt: string;
  orgId: string | null;
  policy: string;
  approvalPolicy: string;
  requiredRoles: string[];
  minApprovals: number;
  requireDistinctReviewers: boolean;
  approvals: Array<{
    id: string;
    createdAt: string;
    reviewerId: string;
    reviewerDisplayName: string;
    role: string;
    decision: OrgApprovalDecision;
    noteHash: string;
    artifactHashes: Array<{ path: string; sha256: string }>;
    signature: { algorithm: "sha256-local"; payloadHash: string };
  }>;
  quorum: {
    status: "not_met" | "met" | "blocked";
    approvedCount: number;
    distinctReviewerCount: number;
    missingRoles: string[];
    blockingReasons: string[];
    warnings: string[];
  };
};

export type ReceiptVerification = {
  runId: string;
  createdAt: string;
  target: string | null;
  remoteUrl: string | null;
  verified: boolean;
  statusCode: number | null;
  receiptId: string | null;
  remoteEntryHash: string | null;
  matchesLocalReceipt: boolean | null;
  warnings: string[];
  errors: string[];
};

export type RetentionPlan = {
  runId: string;
  createdAt: string;
  policy: string;
  retentionDays: number | null;
  legalHold: boolean;
  exportMode: "minimal" | "audit" | "forensic_redacted";
  retainUntil: string | null;
  evidenceClasses: Array<{
    class:
      | "run-ledger"
      | "release"
      | "handoff"
      | "provenance"
      | "evidence"
      | "remote-attestation"
      | "audit"
      | "git-lifecycle";
    required: boolean;
    paths: string[];
    warnings: string[];
  }>;
  purgePreview: Array<{ path: string; eligibleAfter: string | null; reason: string }>;
  warnings: string[];
  nextActions: string[];
};

export type EvidenceExportPolicy = {
  runId: string;
  createdAt: string;
  mode: "minimal" | "audit" | "forensic_redacted";
  includedClasses: string[];
  excludedClasses: string[];
  redaction: {
    enabled: true;
    privateKeysExcluded: true;
    envFilesExcluded: true;
    rawProviderOutputsExcluded: boolean;
    commandLogsExcluded: boolean;
  };
  warnings: string[];
};

export type EvidenceExportManifest = {
  runId: string;
  createdAt: string;
  algorithm: "sha256";
  archivePath: string;
  archiveSha256: string;
  files: Array<{ path: string; sha256: string; sizeBytes: number }>;
  policyPath: string;
  mode: string;
};

export type OrgAuditReport = {
  runId: string;
  createdAt: string;
  org: { orgId: string | null; orgName: string | null };
  policyBundle: {
    present: boolean;
    signed: boolean;
    verified: boolean;
    fingerprint: string | null;
  };
  approvals: { quorumStatus: string; approvedCount: number; missingRoles: string[] };
  remoteReceipt: {
    submitted: boolean;
    verified: boolean;
    receiptId: string | null;
    remoteUrl: string | null;
  };
  retention: {
    policy: string | null;
    marked: boolean;
    retainUntil: string | null;
    legalHold: boolean;
  };
  evidenceExport: { present: boolean; mode: string | null; verified: boolean };
  evidenceLifecycle?: {
    inventory: string;
    archive: string;
    retentionLedger: string;
    legalHold: string;
    compaction: string;
  };
  evidenceDisposal?: {
    eligibility: string;
    plan: string;
    precheck: string;
    execution: string;
  };
  auditLog: { verified: boolean; eventCount: number; latestChainHash: string | null };
  readiness: { releaseReadiness: string | null; deploymentReadiness: string | null };
  warnings: string[];
  blockingReasons: string[];
  nextActions: string[];
};
