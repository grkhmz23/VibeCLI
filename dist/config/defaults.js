export const defaultConfig = {
    version: 1,
    default_profile: "company-grade",
    providers: {
        openrouter: {
            type: "openrouter",
            api_key_env: "OPENROUTER_API_KEY",
            base_url: "https://openrouter.ai/api/v1"
        }
    },
    routing: {
        default_strategy: "balanced",
        strategies: {
            cheap: {
                prefer: ["cost", "speed"],
                max_model_cost_tier: "low",
                allow_fallback: true
            },
            balanced: {
                prefer: ["reliability", "cost", "context"],
                allow_fallback: true
            },
            strongest: {
                prefer: ["capability", "context", "reliability"],
                allow_fallback: true
            },
            "local-first": {
                prefer: ["local", "cost", "privacy"],
                allow_fallback: true
            }
        }
    },
    model_aliases: {
        "fast-coder": {
            provider: "openrouter",
            model: "openai/gpt-4o-mini"
        },
        "strong-coder": {
            provider: "openrouter",
            model: "anthropic/claude-sonnet-4.5"
        }
    },
    profiles: {
        "company-grade": {
            routing_strategy: "balanced",
            agents: {
                intake: {
                    provider: "openrouter",
                    model: "openai/gpt-4o-mini",
                    can_write_files: false,
                    can_run_commands: false
                },
                repo_scanner: {
                    provider: "openrouter",
                    model: "openai/gpt-4o-mini",
                    can_write_files: false,
                    can_run_commands: true
                },
                architect: {
                    provider: "openrouter",
                    model: "openai/gpt-4o",
                    fallback_models: [{ provider: "openrouter", model: "anthropic/claude-sonnet-4.5" }],
                    can_write_files: false,
                    can_run_commands: false
                },
                implementation: {
                    provider: "openrouter",
                    model_alias: "strong-coder",
                    fallback_models: [{ provider: "openrouter", model: "openai/gpt-4o" }],
                    can_write_files: true,
                    can_run_commands: true
                },
                test: {
                    provider: "openrouter",
                    model: "openai/gpt-4o-mini",
                    can_write_files: true,
                    can_run_commands: true
                },
                security: {
                    provider: "openrouter",
                    model: "openai/gpt-4o",
                    fallback_models: [{ provider: "openrouter", model: "anthropic/claude-sonnet-4.5" }],
                    can_write_files: false,
                    can_run_commands: true
                },
                release_manager: {
                    provider: "openrouter",
                    model: "openai/gpt-4o",
                    can_write_files: true,
                    can_run_commands: true
                },
                fixer: {
                    provider: "openrouter",
                    model_alias: "strong-coder",
                    fallback_models: [{ provider: "openrouter", model: "openai/gpt-4o" }],
                    can_write_files: false,
                    can_run_commands: false
                }
            }
        }
    },
    budget: {
        max_run_cost_usd: 15,
        max_agent_cost_usd: 5,
        max_repair_cost_usd: 5,
        max_live_agents_per_run: 8,
        max_stream_tokens_per_agent: 20_000,
        max_total_tokens_per_run: 120_000,
        stop_on_budget_risk: true,
        max_repair_cycles_per_gate: 3,
        max_parallel_agents: 4
    },
    provider_runtime: {
        request_timeout_ms: 120_000
    },
    command_runtime: {
        command_timeout_ms: 60_000
    },
    git_lifecycle: {
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
    },
    release: {
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
    },
    provenance: {
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
    },
    remote_attestation: {
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
    },
    organization: {
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
                standard: {
                    retention_days: 365,
                    legal_hold: false,
                    export_mode: "audit"
                },
                production: {
                    retention_days: 2555,
                    legal_hold: false,
                    export_mode: "audit"
                },
                "legal-hold": {
                    retention_days: null,
                    legal_hold: true,
                    export_mode: "forensic_redacted"
                }
            }
        }
    },
    audit: {
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
    },
    evidence_lifecycle: {
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
        legal_hold: {
            enabled: true,
            require_reason: true
        }
    },
    evidence_disposal: {
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
    },
    dogfood: {
        enabled: true,
        workspace_dir: ".vibecli/dogfood",
        fixtures_dir: ".vibecli/dogfood/fixtures",
        reports_dir: ".vibecli/dogfood/reports",
        default_matrix: [
            "node-package",
            "vite-react",
            "express-api",
            "nextjs-app",
            "python-package",
            "rust-crate",
            "solana-anchor-structural"
        ],
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
    },
    beta: {
        enabled: true,
        reports_dir: ".vibecli/beta/reports",
        trials_dir: ".vibecli/beta/trials",
        feedback_dir: ".vibecli/beta/feedback",
        rc_dir: ".vibecli/beta/release-candidates",
        default_channel: "private-beta",
        allowed_channels: ["private-beta", "closed-beta", "public-beta"],
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
    }
};
export const requiredSecurityPolicy = {
    require_no_secrets_in_source: true,
    require_env_example_for_new_env_vars: true,
    require_rate_limit_for_auth_routes: true,
    require_authz_for_user_data_routes: true,
    require_input_validation_for_api_routes: true,
    require_safe_error_handling: true,
    require_safe_logging: true,
    require_no_private_api_calls_from_frontend: true,
    require_jwt_expiry_and_validation: true,
    require_no_sensitive_data_in_jwt: true,
    require_cors_review_for_api_changes: true,
    require_database_migrations_for_schema_changes: true,
    require_dependency_review: true,
    require_tests_for_new_behavior: true,
    require_observability_notes_for_production_paths: true,
    require_cost_and_rate_limit_notes_for_ai_api_usage: true
};
//# sourceMappingURL=defaults.js.map