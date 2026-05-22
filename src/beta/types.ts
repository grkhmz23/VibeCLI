export const betaChannels = ["private-beta", "closed-beta", "public-beta"] as const;

export type BetaChannel = (typeof betaChannels)[number];

export type BetaConfig = {
  enabled: boolean;
  reports_dir: string;
  trials_dir: string;
  feedback_dir: string;
  rc_dir: string;
  default_channel: BetaChannel;
  allowed_channels: BetaChannel[];
  gates: {
    require_lint_pass: boolean;
    require_test_pass: boolean;
    require_build_pass: boolean;
    require_dogfood_pass: boolean;
    require_security_redteam_pass: boolean;
    require_package_check_pass: boolean;
    require_docs_check_pass: boolean;
    require_perf_check_pass: boolean;
    require_beta_backlog_no_blockers: boolean;
    require_dogfood_patch_apply_smoke: boolean;
    require_live_provider_smoke: boolean;
    require_external_scanners_installed: boolean;
    allow_accepted_warnings: boolean;
  };
  warnings: {
    max_accepted_warnings: number;
    require_acceptance_reason: boolean;
    require_reviewer_for_acceptance: boolean;
  };
  package: {
    require_npm_pack: boolean;
    require_temp_install: boolean;
    require_compiled_cli_smoke: boolean;
    require_no_private_artifacts_in_package: boolean;
  };
  docs: {
    strict_command_coverage: boolean;
    strict_confirmation_docs: boolean;
    forbid_unsupported_capability_claims: boolean;
  };
};

export type BetaState = {
  updatedAt: string;
  latestBetaVerdict:
    | "beta_rc_ready"
    | "ready_with_accepted_warnings"
    | "ready_with_warnings"
    | "blocked"
    | "unknown";
  latestRcReport: string | null;
  latestDogfoodRunId: string | null;
  latestReports: {
    dogfood: string | null;
    dogfoodApplySmoke: string | null;
    liveSmoke: string | null;
    scannerCheck: string | null;
    securityRedteam: string | null;
    packageCheck: string | null;
    packageInstallCheck: string | null;
    docsCheck: string | null;
    docsStrictCheck: string | null;
    perfCheck: string | null;
    betaCheck: string | null;
    betaWarnings: string | null;
    betaBacklog: string | null;
    betaRc: string | null;
  };
  blockers: number;
  warnings: number;
  acceptedWarnings: number;
};

export type BetaWarningRecord = {
  id: string;
  source: string;
  category:
    | "docs"
    | "scanner"
    | "live-provider"
    | "dogfood"
    | "package"
    | "security"
    | "performance"
    | "ux"
    | "other";
  severity: "low" | "medium" | "high";
  message: string;
  blockingByDefault: boolean;
  status: "open" | "accepted" | "resolved";
  acceptedBy: string | null;
  acceptanceReason: string | null;
  acceptedAt: string | null;
};
