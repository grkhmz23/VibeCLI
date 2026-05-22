export type EvidenceArchiveMode = "minimal" | "audit" | "forensic_redacted";
export type EvidenceClass =
  | "run-ledger"
  | "patches"
  | "rollback"
  | "verification"
  | "scanner"
  | "handoff"
  | "git-lifecycle"
  | "release"
  | "provenance"
  | "evidence"
  | "remote-attestation"
  | "organization"
  | "audit"
  | "console"
  | "unknown";

export type EvidenceLifecycleConfig = {
  enabled: boolean;
  archive_dir: string;
  lifecycle_dir: string;
  retention_ledger_dir: string;
  default_archive_mode: EvidenceArchiveMode;
  allowed_archive_modes: EvidenceArchiveMode[];
  require_ledger_pass_for_archive: boolean;
  require_org_retention_plan_for_archive: boolean;
  require_signed_archive_manifest: boolean;
  allow_archive_without_release_packet: boolean;
  allow_archive_without_evidence_bundle: boolean;
  allow_compact_summary_bundle: boolean;
  delete_originals_after_archive: false;
  purge_enabled: false;
  max_archive_bytes: number;
  redaction: {
    exclude_private_keys: boolean;
    exclude_env_files: boolean;
    exclude_raw_provider_outputs: boolean;
    exclude_unbounded_command_logs: boolean;
    redact_secret_like_values: boolean;
  };
  legal_hold: {
    enabled: boolean;
    require_reason: boolean;
  };
};

export type EvidenceInventory = {
  runId: string;
  createdAt: string;
  repoRoot: string;
  summary: {
    totalFiles: number;
    totalBytes: number;
    includedFiles: number;
    excludedFiles: number;
    secretLikeFindings: number;
    privateKeyFindings: number;
    envFileFindings: number;
  };
  classes: Array<{
    class: EvidenceClass;
    files: number;
    bytes: number;
    requiredForAudit: boolean;
    requiredForRelease: boolean;
    recommendedRetention: "short" | "standard" | "long" | "legal_hold";
  }>;
  files: EvidenceInventoryFile[];
  warnings: string[];
};

export type EvidenceInventoryFile = {
  path: string;
  class: EvidenceClass;
  sizeBytes: number;
  sha256: string;
  sensitivity: "public_metadata" | "internal" | "sensitive" | "blocked";
  includedInDefaultArchive: boolean;
  excluded: boolean;
  exclusionReason: string | null;
  warnings: string[];
};

export type RetentionEnforcementPreview = {
  runId: string;
  createdAt: string;
  policy: string | null;
  legalHold: boolean;
  archiveRecommended: boolean;
  archiveMode: EvidenceArchiveMode;
  eligibleForArchive: Array<{ path: string; class: string; reason: string }>;
  blockedFromArchive: Array<{ path: string; reason: string }>;
  purgeCandidates: Array<{ path: string; eligibleAfter: string | null; reason: string }>;
  purgeImplemented: false;
  warnings: string[];
  nextActions: string[];
};

export type EvidenceArchiveManifest = {
  runId: string;
  createdAt: string;
  mode: EvidenceArchiveMode;
  algorithm: "sha256";
  archivePath: string;
  archiveSha256: string;
  archiveSizeBytes: number;
  files: Array<{
    path: string;
    sha256: string;
    sizeBytes: number;
    class: string;
    redacted: boolean;
  }>;
  excluded: Array<{ path: string; reason: string }>;
  signed: boolean;
  signature: {
    algorithm: "sha256-local" | "ed25519" | null;
    publicKeyFingerprint: string | null;
    signatureBase64: string | null;
  };
  warnings: string[];
};

export type LegalHoldRecord = {
  runId: string;
  status: "enabled" | "released";
  enabledAt: string;
  releasedAt: string | null;
  enabledBy: string;
  releasedBy: string | null;
  reasonHash: string;
  reasonSummary: string;
  releaseReasonHash: string | null;
  releaseReasonSummary: string | null;
  warnings: string[];
};

export type EvidenceLifecycleReport = {
  runId: string;
  createdAt: string;
  inventory: {
    status: "not_started" | "generated" | "failed";
    totalFiles: number;
    totalBytes: number;
    blockedFiles: number;
  };
  retention: {
    status: string | null;
    policy: string | null;
    retainUntil: string | null;
    legalHold: boolean | null;
  };
  archive: {
    status: "not_started" | "previewed" | "archived" | "verified" | "invalid" | "failed";
    mode: string | null;
    archivePath: string | null;
    archiveSha256: string | null;
  };
  legalHold: {
    status: "not_started" | "enabled" | "released" | "failed";
    reasonHash: string | null;
    enabledAt: string | null;
    releasedAt: string | null;
  };
  retentionLedger: {
    status: "not_started" | "recorded" | "verified" | "invalid" | "failed";
    latestChainHash: string | null;
  };
  compaction: {
    status: "not_started" | "reported" | "bundled" | "verified" | "invalid" | "failed";
    estimatedSavingsBytes: number | null;
  };
  nextActions: string[];
  warnings: string[];
};

export type RetentionLedgerEvent = {
  version: 1;
  createdAt: string;
  eventType:
    | "inventory_generated"
    | "retention_previewed"
    | "archive_created"
    | "archive_verified"
    | "legal_hold_enabled"
    | "legal_hold_released"
    | "compaction_reported"
    | "compaction_bundle_created"
    | "disposal_eligibility_checked"
    | "disposal_candidates_generated"
    | "disposal_plan_created"
    | "disposal_attestation_created"
    | "disposal_approval_added"
    | "disposal_precheck_passed"
    | "disposal_executed"
    | "disposal_receipt_recorded";
  runId: string;
  actor: string | null;
  summary: string;
  artifactHashes: Array<{ path: string; sha256: string }>;
  signature: {
    algorithm: "ed25519" | "sha256-local";
    publicKeyFingerprint: string | null;
    payloadHash: string;
    signatureBase64: string | null;
  };
};

export type RetentionChainEntry = {
  index: number;
  createdAt: string;
  runId: string;
  eventHash: string;
  previousChainHash: string | null;
  chainHash: string;
};
