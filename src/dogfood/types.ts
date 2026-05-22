export const dogfoodFixtureTypes = [
  "node-package",
  "vite-react",
  "express-api",
  "nextjs-app",
  "python-package",
  "rust-crate",
  "solana-anchor-structural"
] as const;

export type DogfoodFixtureType = (typeof dogfoodFixtureTypes)[number];

export type DogfoodConfig = {
  enabled: boolean;
  workspace_dir: string;
  fixtures_dir: string;
  reports_dir: string;
  default_matrix: DogfoodFixtureType[];
  allow_live_provider_smoke: boolean;
  require_live_confirmation: boolean;
  allow_fixture_patch_apply: boolean;
  allow_real_repo_patch_apply: boolean;
  max_fixture_runtime_ms: number;
  max_total_runtime_ms: number;
  max_report_bytes: number;
  external_scanners: {
    detect_only_by_default: boolean;
    allow_execution: boolean;
  };
  package_check: {
    run_npm_pack: boolean;
    install_packed_cli_in_temp: boolean;
    run_packed_cli_smoke: boolean;
  };
  safety: {
    run_red_team_harness: boolean;
    block_network_by_default: boolean;
    redact_outputs: boolean;
  };
};

export type DogfoodState = {
  updatedAt: string;
  latestDogfoodRunId: string | null;
  latestBetaVerdict: "beta_ready" | "ready_with_warnings" | "blocked" | "unknown";
  latestReports: {
    dogfood: string | null;
    securityRedteam: string | null;
    packageCheck: string | null;
    docsCheck: string | null;
    perfCheck: string | null;
    betaCheck: string | null;
    betaBacklog: string | null;
  };
};

export type DogfoodCommandResult = {
  command: string;
  status: "passed" | "failed" | "skipped";
  durationMs: number;
  reason: string | null;
};

export type DogfoodReport = {
  dogfoodRunId: string;
  createdAt: string;
  mode: "dry-run" | "live-optional";
  fixtures: Array<{
    fixture: DogfoodFixtureType;
    repoPath: string;
    status: "passed" | "failed" | "skipped";
    vibeRunId: string | null;
    commands: DogfoodCommandResult[];
    artifacts: {
      runCreated: boolean;
      workspaceCreated: boolean;
      reviewCreated: boolean;
      ledgerVerified: boolean;
      betaSafe: boolean;
    };
    warnings: string[];
    errors: string[];
  }>;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    durationMs: number;
  };
  blockers: string[];
  warnings: string[];
  nextActions: string[];
};
