export type ReleaseChannel = string;

export type ReleaseRisk = {
  severity: "low" | "medium" | "high" | "critical";
  source: string;
  message: string;
  recommendation: string;
};

export type ReleaseSummary = {
  runId: string;
  createdAt: string;
  channel: ReleaseChannel;
  policy: string | null;
  profile: string | null;
  version: {
    current: string | null;
    planned: string | null;
    bump: "none" | "patch" | "minor" | "major" | "prerelease" | null;
  };
  git: {
    branch: string | null;
    commitSha: string | null;
    releaseBranch: string | null;
    tag: string | null;
  };
  gates: {
    ledger: "pass" | "fail" | "missing" | "unknown";
    verification: "passed" | "failed" | "skipped" | "not_started" | "unknown";
    scanners: "passed" | "failed" | "warning" | "skipped" | "not_started" | "unknown";
    readiness: string | null;
    mergeReadiness: string | null;
    ci: "passed" | "failed" | "pending" | "unknown" | "not_ingested";
  };
  risks: ReleaseRisk[];
  releaseVerdict:
    | "ready_for_internal"
    | "ready_for_beta"
    | "ready_for_staging"
    | "ready_for_production"
    | "ready_with_warnings"
    | "blocked";
  blockingReasons: string[];
  warnings: string[];
  nextActions: string[];
};

export type ReleaseManifest = {
  runId: string;
  createdAt: string;
  algorithm: "sha256";
  files: Array<{ path: string; sha256: string; sizeBytes: number }>;
  manifestHash: string;
};

export type VersionBump = "none" | "patch" | "minor" | "major" | "prerelease";

export type VersionPlan = {
  runId: string;
  createdAt: string;
  currentVersion: string | null;
  plannedVersion: string | null;
  bump: VersionBump;
  prereleaseIdentifier: string | null;
  files: Array<{ path: string; currentVersion: string; plannedVersion: string }>;
  reason: string;
  warnings: string[];
};

export type ChangelogEntry = {
  runId: string;
  createdAt: string;
  style: "keepachangelog";
  version: string | null;
  date: string;
  sections: {
    added: string[];
    changed: string[];
    fixed: string[];
    security: string[];
    deprecated: string[];
    removed: string[];
  };
  warnings: string[];
};

export type CiStatus = {
  runId: string;
  createdAt: string;
  source: "github" | "local";
  status: "passed" | "failed" | "pending" | "unknown";
  checks: Array<{ name: string; status: string; conclusion: string | null; url: string | null }>;
  failed: number;
  pending: number;
  passed: number;
  warnings: string[];
};
