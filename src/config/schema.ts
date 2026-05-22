import { z } from "zod";
import { dogfoodFixtureTypes } from "../dogfood/types.js";
import { betaChannels } from "../beta/types.js";

export const providerConfigSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("openrouter"),
    api_key_env: z.string().min(1),
    base_url: z.string().url().default("https://openrouter.ai/api/v1")
  }),
  z.object({
    type: z.literal("openai-compatible"),
    api_key_env: z.string().min(1),
    base_url: z.string().url()
  }),
  z.object({
    type: z.literal("external-opencode"),
    username_env: z.string().min(1).optional(),
    password_env: z.string().min(1).optional()
  })
]);

export const remoteAttestationTargetSchema = z.object({
  type: z.literal("generic-http"),
  url: z.string().min(1),
  token_env: z.string().min(1).optional(),
  enabled: z.boolean().default(true),
  headers: z.record(z.string().min(1), z.string()).default({})
});

export const auditConfigSchema = z
  .object({
    enabled: z.boolean().default(true),
    schema_dir: z.string().min(1).default(".vibecli/audit/schemas"),
    export_dir: z.string().min(1).default(".vibecli/audit/exports"),
    reviewer_directory_dir: z.string().min(1).default(".vibecli/audit/reviewer-directory"),
    default_schema: z.string().min(1).default("internal-secure-release"),
    allow_custom_schemas: z.boolean().default(true),
    require_signed_audit_exports: z.boolean().default(false),
    include_raw_logs_by_default: z.boolean().default(false),
    max_export_bytes: z.number().int().positive().max(50_000_000).default(5_000_000),
    allowed_export_formats: z
      .array(z.enum(["json", "markdown", "csv"]))
      .default(["json", "markdown", "csv"]),
    compliance_language: z
      .object({
        avoid_certification_claims: z.boolean().default(true),
        use_control_mapping_terms: z.boolean().default(true)
      })
      .default({
        avoid_certification_claims: true,
        use_control_mapping_terms: true
      }),
    retention: z
      .object({
        audit_export_retention_days: z.number().int().positive().default(2555),
        legal_hold: z.boolean().default(false)
      })
      .default({
        audit_export_retention_days: 2555,
        legal_hold: false
      })
  })
  .default({
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
  });

export const evidenceLifecycleConfigSchema = z
  .object({
    enabled: z.boolean().default(true),
    archive_dir: z.string().min(1).default(".vibecli/evidence-archive"),
    lifecycle_dir: z.string().min(1).default(".vibecli/evidence-lifecycle"),
    retention_ledger_dir: z.string().min(1).default(".vibecli/evidence-lifecycle/retention-ledger"),
    default_archive_mode: z.enum(["minimal", "audit", "forensic_redacted"]).default("audit"),
    allowed_archive_modes: z
      .array(z.enum(["minimal", "audit", "forensic_redacted"]))
      .default(["minimal", "audit", "forensic_redacted"]),
    require_ledger_pass_for_archive: z.boolean().default(true),
    require_org_retention_plan_for_archive: z.boolean().default(false),
    require_signed_archive_manifest: z.boolean().default(false),
    allow_archive_without_release_packet: z.boolean().default(true),
    allow_archive_without_evidence_bundle: z.boolean().default(true),
    allow_compact_summary_bundle: z.boolean().default(true),
    delete_originals_after_archive: z.literal(false).default(false),
    purge_enabled: z.literal(false).default(false),
    max_archive_bytes: z.number().int().positive().max(100_000_000).default(10_000_000),
    redaction: z
      .object({
        exclude_private_keys: z.boolean().default(true),
        exclude_env_files: z.boolean().default(true),
        exclude_raw_provider_outputs: z.boolean().default(true),
        exclude_unbounded_command_logs: z.boolean().default(true),
        redact_secret_like_values: z.boolean().default(true)
      })
      .default({
        exclude_private_keys: true,
        exclude_env_files: true,
        exclude_raw_provider_outputs: true,
        exclude_unbounded_command_logs: true,
        redact_secret_like_values: true
      }),
    legal_hold: z
      .object({
        enabled: z.boolean().default(true),
        require_reason: z.boolean().default(true)
      })
      .default({ enabled: true, require_reason: true })
  })
  .default({
    enabled: true,
    archive_dir: ".vibecli/evidence-archive",
    lifecycle_dir: ".vibecli/evidence-lifecycle",
    retention_ledger_dir: ".vibecli/evidence-lifecycle/retention-ledger",
    default_archive_mode: "audit",
    allowed_archive_modes: ["minimal", "audit", "forensic_redacted"],
    require_ledger_pass_for_archive: true,
    require_org_retention_plan_for_archive: false,
    require_signed_archive_manifest: false,
    allow_archive_without_release_packet: true,
    allow_archive_without_evidence_bundle: true,
    allow_compact_summary_bundle: true,
    delete_originals_after_archive: false,
    purge_enabled: false,
    max_archive_bytes: 10_000_000,
    redaction: {
      exclude_private_keys: true,
      exclude_env_files: true,
      exclude_raw_provider_outputs: true,
      exclude_unbounded_command_logs: true,
      redact_secret_like_values: true
    },
    legal_hold: { enabled: true, require_reason: true }
  });

export const evidenceDisposalConfigSchema = z
  .object({
    enabled: z.boolean().default(true),
    disposal_dir: z.string().min(1).default(".vibecli/evidence-lifecycle/disposal"),
    require_retention_expired: z.boolean().default(true),
    require_no_legal_hold: z.boolean().default(true),
    require_archive_verified: z.boolean().default(true),
    require_retention_ledger: z.boolean().default(true),
    require_org_approval: z.boolean().default(false),
    require_disposal_attestation: z.boolean().default(true),
    delete_scope: z.literal("run-evidence-only").default("run-evidence-only"),
    allow_archive_deletion: z.literal(false).default(false),
    allow_key_deletion: z.literal(false).default(false),
    allow_source_deletion: z.literal(false).default(false),
    allow_remote_deletion: z.literal(false).default(false),
    allow_automatic_purge: z.literal(false).default(false),
    dry_run_by_default: z.literal(true).default(true),
    max_files_per_disposal: z.number().int().positive().max(10_000).default(500),
    max_bytes_per_disposal: z.number().int().positive().max(500_000_000).default(50_000_000),
    protected_classes: z
      .array(z.string().min(1))
      .default([
        "private-keys",
        "env-files",
        "source-code",
        "archives",
        "org-keys",
        "provenance-keys",
        "git"
      ]),
    receipt: z
      .object({
        require_sha256_before_delete: z.boolean().default(true),
        require_post_delete_verification: z.boolean().default(true),
        include_recovery_guidance: z.boolean().default(true)
      })
      .default({
        require_sha256_before_delete: true,
        require_post_delete_verification: true,
        include_recovery_guidance: true
      })
  })
  .default({
    enabled: true,
    disposal_dir: ".vibecli/evidence-lifecycle/disposal",
    require_retention_expired: true,
    require_no_legal_hold: true,
    require_archive_verified: true,
    require_retention_ledger: true,
    require_org_approval: false,
    require_disposal_attestation: true,
    delete_scope: "run-evidence-only",
    allow_archive_deletion: false,
    allow_key_deletion: false,
    allow_source_deletion: false,
    allow_remote_deletion: false,
    allow_automatic_purge: false,
    dry_run_by_default: true,
    max_files_per_disposal: 500,
    max_bytes_per_disposal: 50_000_000,
    protected_classes: [
      "private-keys",
      "env-files",
      "source-code",
      "archives",
      "org-keys",
      "provenance-keys",
      "git"
    ],
    receipt: {
      require_sha256_before_delete: true,
      require_post_delete_verification: true,
      include_recovery_guidance: true
    }
  });

export const dogfoodConfigSchema = z
  .object({
    enabled: z.boolean().default(true),
    workspace_dir: z.string().min(1).default(".vibecli/dogfood"),
    fixtures_dir: z.string().min(1).default(".vibecli/dogfood/fixtures"),
    reports_dir: z.string().min(1).default(".vibecli/dogfood/reports"),
    default_matrix: z.array(z.enum(dogfoodFixtureTypes)).default([...dogfoodFixtureTypes]),
    allow_live_provider_smoke: z.boolean().default(false),
    require_live_confirmation: z.boolean().default(true),
    allow_fixture_patch_apply: z.boolean().default(true),
    allow_real_repo_patch_apply: z.boolean().default(false),
    max_fixture_runtime_ms: z.number().int().positive().max(600_000).default(120_000),
    max_total_runtime_ms: z.number().int().positive().max(3_600_000).default(600_000),
    max_report_bytes: z.number().int().positive().max(100_000_000).default(10_000_000),
    external_scanners: z
      .object({
        detect_only_by_default: z.boolean().default(true),
        allow_execution: z.boolean().default(false)
      })
      .default({ detect_only_by_default: true, allow_execution: false }),
    package_check: z
      .object({
        run_npm_pack: z.boolean().default(true),
        install_packed_cli_in_temp: z.boolean().default(true),
        run_packed_cli_smoke: z.boolean().default(true)
      })
      .default({
        run_npm_pack: true,
        install_packed_cli_in_temp: true,
        run_packed_cli_smoke: true
      }),
    safety: z
      .object({
        run_red_team_harness: z.boolean().default(true),
        block_network_by_default: z.boolean().default(true),
        redact_outputs: z.boolean().default(true)
      })
      .default({
        run_red_team_harness: true,
        block_network_by_default: true,
        redact_outputs: true
      })
  })
  .default({
    enabled: true,
    workspace_dir: ".vibecli/dogfood",
    fixtures_dir: ".vibecli/dogfood/fixtures",
    reports_dir: ".vibecli/dogfood/reports",
    default_matrix: [...dogfoodFixtureTypes],
    allow_live_provider_smoke: false,
    require_live_confirmation: true,
    allow_fixture_patch_apply: true,
    allow_real_repo_patch_apply: false,
    max_fixture_runtime_ms: 120_000,
    max_total_runtime_ms: 600_000,
    max_report_bytes: 10_000_000,
    external_scanners: {
      detect_only_by_default: true,
      allow_execution: false
    },
    package_check: {
      run_npm_pack: true,
      install_packed_cli_in_temp: true,
      run_packed_cli_smoke: true
    },
    safety: {
      run_red_team_harness: true,
      block_network_by_default: true,
      redact_outputs: true
    }
  });

export const betaConfigSchema = z
  .object({
    enabled: z.boolean().default(true),
    reports_dir: z.string().min(1).default(".vibecli/beta/reports"),
    trials_dir: z.string().min(1).default(".vibecli/beta/trials"),
    feedback_dir: z.string().min(1).default(".vibecli/beta/feedback"),
    rc_dir: z.string().min(1).default(".vibecli/beta/release-candidates"),
    default_channel: z.enum(betaChannels).default("private-beta"),
    allowed_channels: z.array(z.enum(betaChannels)).default([...betaChannels]),
    gates: z
      .object({
        require_lint_pass: z.boolean().default(true),
        require_test_pass: z.boolean().default(true),
        require_build_pass: z.boolean().default(true),
        require_dogfood_pass: z.boolean().default(true),
        require_security_redteam_pass: z.boolean().default(true),
        require_package_check_pass: z.boolean().default(true),
        require_docs_check_pass: z.boolean().default(true),
        require_perf_check_pass: z.boolean().default(true),
        require_beta_backlog_no_blockers: z.boolean().default(true),
        require_dogfood_patch_apply_smoke: z.boolean().default(true),
        require_live_provider_smoke: z.boolean().default(false),
        require_external_scanners_installed: z.boolean().default(false),
        allow_accepted_warnings: z.boolean().default(true)
      })
      .default({
        require_lint_pass: true,
        require_test_pass: true,
        require_build_pass: true,
        require_dogfood_pass: true,
        require_security_redteam_pass: true,
        require_package_check_pass: true,
        require_docs_check_pass: true,
        require_perf_check_pass: true,
        require_beta_backlog_no_blockers: true,
        require_dogfood_patch_apply_smoke: true,
        require_live_provider_smoke: false,
        require_external_scanners_installed: false,
        allow_accepted_warnings: true
      }),
    warnings: z
      .object({
        max_accepted_warnings: z.number().int().nonnegative().max(50).default(5),
        require_acceptance_reason: z.boolean().default(true),
        require_reviewer_for_acceptance: z.boolean().default(true)
      })
      .default({
        max_accepted_warnings: 5,
        require_acceptance_reason: true,
        require_reviewer_for_acceptance: true
      }),
    package: z
      .object({
        require_npm_pack: z.boolean().default(true),
        require_temp_install: z.boolean().default(true),
        require_compiled_cli_smoke: z.boolean().default(true),
        require_no_private_artifacts_in_package: z.boolean().default(true)
      })
      .default({
        require_npm_pack: true,
        require_temp_install: true,
        require_compiled_cli_smoke: true,
        require_no_private_artifacts_in_package: true
      }),
    docs: z
      .object({
        strict_command_coverage: z.boolean().default(true),
        strict_confirmation_docs: z.boolean().default(true),
        forbid_unsupported_capability_claims: z.boolean().default(true)
      })
      .default({
        strict_command_coverage: true,
        strict_confirmation_docs: true,
        forbid_unsupported_capability_claims: true
      })
  })
  .default({
    enabled: true,
    reports_dir: ".vibecli/beta/reports",
    trials_dir: ".vibecli/beta/trials",
    feedback_dir: ".vibecli/beta/feedback",
    rc_dir: ".vibecli/beta/release-candidates",
    default_channel: "private-beta",
    allowed_channels: [...betaChannels],
    gates: {
      require_lint_pass: true,
      require_test_pass: true,
      require_build_pass: true,
      require_dogfood_pass: true,
      require_security_redteam_pass: true,
      require_package_check_pass: true,
      require_docs_check_pass: true,
      require_perf_check_pass: true,
      require_beta_backlog_no_blockers: true,
      require_dogfood_patch_apply_smoke: true,
      require_live_provider_smoke: false,
      require_external_scanners_installed: false,
      allow_accepted_warnings: true
    },
    warnings: {
      max_accepted_warnings: 5,
      require_acceptance_reason: true,
      require_reviewer_for_acceptance: true
    },
    package: {
      require_npm_pack: true,
      require_temp_install: true,
      require_compiled_cli_smoke: true,
      require_no_private_artifacts_in_package: true
    },
    docs: {
      strict_command_coverage: true,
      strict_confirmation_docs: true,
      forbid_unsupported_capability_claims: true
    }
  });

export const organizationConfigSchema = z
  .object({
    enabled: z.boolean().default(false),
    org_id: z.string().min(1).default("local-org"),
    org_name: z.string().min(1).default("Local Organization"),
    policy_bundle_dir: z.string().min(1).default(".vibecli/org/policy-bundles"),
    key_dir: z.string().min(1).default(".vibecli/org/keys"),
    audit_log_dir: z.string().min(1).default(".vibecli/org/audit"),
    require_signed_policy_bundle: z.boolean().default(false),
    require_multi_reviewer_approval_for_release: z.boolean().default(false),
    require_remote_receipt_refresh_for_release: z.boolean().default(false),
    require_retention_plan_for_release: z.boolean().default(false),
    default_approval_policy: z.string().min(1).default("company-grade-release"),
    reviewers: z
      .array(
        z.object({
          id: z.string().min(1),
          display_name: z.string().min(1),
          roles: z.array(z.string().min(1)).default([])
        })
      )
      .default([
        {
          id: "local-reviewer",
          display_name: "Local Reviewer",
          roles: ["owner", "release_manager"]
        }
      ]),
    approval_policies: z
      .record(
        z.string().min(1),
        z.object({
          min_approvals: z.number().int().positive(),
          required_roles: z.array(z.string().min(1)).default([]),
          disallow_self_approval: z.boolean().default(false),
          require_distinct_reviewers: z.boolean().default(true),
          allow_needs_changes: z.boolean().default(false)
        })
      )
      .default({
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
      }),
    retention: z
      .object({
        default_policy: z.string().min(1).default("standard"),
        policies: z
          .record(
            z.string().min(1),
            z.object({
              retention_days: z.number().int().positive().nullable(),
              legal_hold: z.boolean().default(false),
              export_mode: z.enum(["minimal", "audit", "forensic_redacted"]).default("audit")
            })
          )
          .default({
            standard: { retention_days: 365, legal_hold: false, export_mode: "audit" },
            production: { retention_days: 2555, legal_hold: false, export_mode: "audit" },
            "legal-hold": {
              retention_days: null,
              legal_hold: true,
              export_mode: "forensic_redacted"
            }
          })
      })
      .default({
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
      })
  })
  .default({});

export const agentConfigSchema = z
  .object({
    provider: z.string().min(1),
    model: z.string().min(1).optional(),
    model_alias: z.string().min(1).optional(),
    fallback_models: z
      .array(
        z.object({
          provider: z.string().min(1).optional(),
          model: z.string().min(1).optional(),
          model_alias: z.string().min(1).optional()
        })
      )
      .optional(),
    can_write_files: z.boolean(),
    can_run_commands: z.boolean()
  })
  .superRefine((value, context) => {
    if (value.model && value.model_alias) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Agent config cannot set both model and model_alias",
        path: ["model_alias"]
      });
    }
    if (!value.model && !value.model_alias) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Agent config must set model or model_alias",
        path: ["model"]
      });
    }
  });

export const configSchema = z.object({
  version: z.literal(1),
  default_profile: z.string().min(1),
  providers: z.record(z.string().min(1), providerConfigSchema),
  profiles: z.record(
    z.string().min(1),
    z.object({
      agents: z.record(z.string().min(1), agentConfigSchema),
      routing_strategy: z.string().min(1).optional()
    })
  ),
  routing: z
    .object({
      default_strategy: z.string().min(1).default("balanced"),
      strategies: z.record(
        z.string().min(1),
        z.object({
          prefer: z.array(z.string().min(1)).default([]),
          max_model_cost_tier: z.enum(["free", "low", "medium", "high", "unknown"]).optional(),
          allow_fallback: z.boolean().default(true)
        })
      )
    })
    .default({
      default_strategy: "balanced",
      strategies: {}
    }),
  model_aliases: z
    .record(
      z.string().min(1),
      z.object({
        provider: z.string().min(1),
        model: z.string().min(1)
      })
    )
    .default({}),
  budget: z.object({
    max_run_cost_usd: z.number().positive(),
    max_agent_cost_usd: z.number().positive().optional(),
    max_repair_cost_usd: z.number().positive().optional(),
    max_live_agents_per_run: z.number().int().positive().optional(),
    max_stream_tokens_per_agent: z.number().int().positive().optional(),
    max_total_tokens_per_run: z.number().int().positive().optional(),
    stop_on_budget_risk: z.boolean().default(true),
    max_repair_cycles_per_gate: z.number().int().nonnegative(),
    max_parallel_agents: z.number().int().positive()
  }),
  provider_runtime: z
    .object({
      request_timeout_ms: z.number().int().positive().default(120_000)
    })
    .default({ request_timeout_ms: 120_000 }),
  command_runtime: z
    .object({
      command_timeout_ms: z.number().int().positive().default(60_000)
    })
    .default({ command_timeout_ms: 60_000 }),
  git_lifecycle: z
    .object({
      branch_prefix: z.string().min(1).default("vibe"),
      commit_style: z.enum(["conventional", "plain"]).default("conventional"),
      protected_branches: z
        .array(z.string().min(1))
        .default(["main", "master", "production", "release"]),
      allow_commit_on_protected_branch: z.boolean().default(false),
      require_applied_before_commit: z.boolean().default(true),
      require_verification_before_commit: z.boolean().default(true),
      require_ledger_pass_before_commit: z.boolean().default(true),
      require_scanner_no_high_or_critical_before_commit: z.boolean().default(true),
      stage_only_applied_files: z.boolean().default(true),
      include_handoff_artifacts_by_default: z.boolean().default(false),
      allow_dirty_worktree_for_branch_create: z.boolean().default(false),
      allow_dirty_worktree_for_commit: z.boolean().default(false)
    })
    .default({
      branch_prefix: "vibe",
      commit_style: "conventional",
      protected_branches: ["main", "master", "production", "release"],
      allow_commit_on_protected_branch: false,
      require_applied_before_commit: true,
      require_verification_before_commit: true,
      require_ledger_pass_before_commit: true,
      require_scanner_no_high_or_critical_before_commit: true,
      stage_only_applied_files: true,
      include_handoff_artifacts_by_default: false,
      allow_dirty_worktree_for_branch_create: false,
      allow_dirty_worktree_for_commit: false
    }),
  release: z
    .object({
      default_channel: z.string().min(1).default("internal"),
      allowed_channels: z
        .array(z.string().min(1))
        .default(["internal", "beta", "staging", "production"]),
      versioning: z
        .object({
          strategy: z.literal("semver").default("semver"),
          allow_prerelease: z.boolean().default(true),
          prerelease_identifiers: z.array(z.string().min(1)).default(["alpha", "beta", "rc"])
        })
        .default({
          strategy: "semver",
          allow_prerelease: true,
          prerelease_identifiers: ["alpha", "beta", "rc"]
        }),
      changelog: z
        .object({
          file: z.string().min(1).default("CHANGELOG.md"),
          style: z.literal("keepachangelog").default("keepachangelog"),
          include_vibecli_footer: z.boolean().default(true)
        })
        .default({
          file: "CHANGELOG.md",
          style: "keepachangelog",
          include_vibecli_footer: true
        }),
      release_branch: z
        .object({
          prefix: z.string().min(1).default("release"),
          protected_target_branches: z
            .array(z.string().min(1))
            .default(["main", "master", "production"])
        })
        .default({
          prefix: "release",
          protected_target_branches: ["main", "master", "production"]
        }),
      tags: z
        .object({
          prefix: z.string().min(1).default("v"),
          annotated: z.boolean().default(true),
          allow_tag_on_dirty_worktree: z.boolean().default(false)
        })
        .default({
          prefix: "v",
          annotated: true,
          allow_tag_on_dirty_worktree: false
        }),
      ci: z
        .object({
          providers: z.array(z.string().min(1)).default(["github-actions"]),
          require_ci_pass_for_production: z.boolean().default(true)
        })
        .default({ providers: ["github-actions"], require_ci_pass_for_production: true }),
      deployment: z
        .object({
          require_deployment_readiness_for_production: z.boolean().default(true),
          execute_deploy_commands: z.literal(false).default(false)
        })
        .default({
          require_deployment_readiness_for_production: true,
          execute_deploy_commands: false
        })
    })
    .default({
      default_channel: "internal",
      allowed_channels: ["internal", "beta", "staging", "production"],
      versioning: {
        strategy: "semver",
        allow_prerelease: true,
        prerelease_identifiers: ["alpha", "beta", "rc"]
      },
      changelog: {
        file: "CHANGELOG.md",
        style: "keepachangelog",
        include_vibecli_footer: true
      },
      release_branch: {
        prefix: "release",
        protected_target_branches: ["main", "master", "production"]
      },
      tags: {
        prefix: "v",
        annotated: true,
        allow_tag_on_dirty_worktree: false
      },
      ci: {
        providers: ["github-actions"],
        require_ci_pass_for_production: true
      },
      deployment: {
        require_deployment_readiness_for_production: true,
        execute_deploy_commands: false
      }
    }),
  provenance: z
    .object({
      enabled: z.boolean().default(true),
      format: z.literal("slsa-inspired").default("slsa-inspired"),
      signing: z
        .object({
          enabled: z.boolean().default(true),
          algorithm: z.literal("ed25519").default("ed25519"),
          key_dir: z.string().min(1).default(".vibecli/keys"),
          private_key_file: z.string().min(1).default("release-signing-key.private.pem"),
          public_key_file: z.string().min(1).default("release-signing-key.public.pem"),
          require_local_key_for_signing: z.boolean().default(true)
        })
        .default({
          enabled: true,
          algorithm: "ed25519",
          key_dir: ".vibecli/keys",
          private_key_file: "release-signing-key.private.pem",
          public_key_file: "release-signing-key.public.pem",
          require_local_key_for_signing: true
        }),
      evidence: z
        .object({
          include_release_packet: z.boolean().default(true),
          include_handoff_summary: z.boolean().default(true),
          include_ledger_manifest: z.boolean().default(true),
          include_verification_results: z.boolean().default(true),
          include_scanner_results: z.boolean().default(true),
          include_ci_status: z.boolean().default(true),
          include_deployment_readiness: z.boolean().default(true),
          include_git_lifecycle: z.boolean().default(true)
        })
        .default({
          include_release_packet: true,
          include_handoff_summary: true,
          include_ledger_manifest: true,
          include_verification_results: true,
          include_scanner_results: true,
          include_ci_status: true,
          include_deployment_readiness: true,
          include_git_lifecycle: true
        }),
      github_release: z
        .object({
          allow_draft_creation: z.boolean().default(true),
          publish_releases: z.literal(false).default(false),
          upload_assets: z.literal(false).default(false),
          require_existing_remote_tag: z.boolean().default(true),
          require_release_readiness_for_draft: z.boolean().default(false),
          require_release_readiness_for_production_draft: z.boolean().default(true)
        })
        .default({
          allow_draft_creation: true,
          publish_releases: false,
          upload_assets: false,
          require_existing_remote_tag: true,
          require_release_readiness_for_draft: false,
          require_release_readiness_for_production_draft: true
        })
    })
    .default({
      enabled: true,
      format: "slsa-inspired",
      signing: {
        enabled: true,
        algorithm: "ed25519",
        key_dir: ".vibecli/keys",
        private_key_file: "release-signing-key.private.pem",
        public_key_file: "release-signing-key.public.pem",
        require_local_key_for_signing: true
      },
      evidence: {
        include_release_packet: true,
        include_handoff_summary: true,
        include_ledger_manifest: true,
        include_verification_results: true,
        include_scanner_results: true,
        include_ci_status: true,
        include_deployment_readiness: true,
        include_git_lifecycle: true
      },
      github_release: {
        allow_draft_creation: true,
        publish_releases: false,
        upload_assets: false,
        require_existing_remote_tag: true,
        require_release_readiness_for_draft: false,
        require_release_readiness_for_production_draft: true
      }
    }),
  remote_attestation: z
    .object({
      enabled: z.boolean().default(true),
      allow_remote_submission: z.boolean().default(false),
      require_exact_confirmation: z.boolean().default(true),
      require_signed_provenance: z.boolean().default(true),
      require_evidence_bundle: z.boolean().default(true),
      require_ledger_pass: z.boolean().default(true),
      require_release_packet: z.boolean().default(true),
      require_https_targets: z.boolean().default(true),
      allow_localhost_targets: z.boolean().default(false),
      max_payload_bytes: z.number().int().positive().max(10_000_000).default(2_000_000),
      request_timeout_ms: z.number().int().positive().default(30_000),
      send_metadata_only: z.boolean().default(true),
      include_evidence_archive_by_default: z.boolean().default(false),
      targets: z.record(z.string().min(1), remoteAttestationTargetSchema).default({})
    })
    .default({
      enabled: true,
      allow_remote_submission: false,
      require_exact_confirmation: true,
      require_signed_provenance: true,
      require_evidence_bundle: true,
      require_ledger_pass: true,
      require_release_packet: true,
      require_https_targets: true,
      allow_localhost_targets: false,
      max_payload_bytes: 2_000_000,
      request_timeout_ms: 30_000,
      send_metadata_only: true,
      include_evidence_archive_by_default: false,
      targets: {}
    }),
  audit: auditConfigSchema,
  evidence_lifecycle: evidenceLifecycleConfigSchema,
  evidence_disposal: evidenceDisposalConfigSchema,
  dogfood: dogfoodConfigSchema,
  beta: betaConfigSchema,
  organization: organizationConfigSchema
});

export type VibeConfig = z.infer<typeof configSchema>;
export type ProviderConfig = z.infer<typeof providerConfigSchema>;
