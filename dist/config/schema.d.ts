import { z } from "zod";
export declare const providerConfigSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"openrouter">;
    api_key_env: z.ZodString;
    base_url: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "openrouter";
    api_key_env: string;
    base_url: string;
}, {
    type: "openrouter";
    api_key_env: string;
    base_url?: string | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"openai-compatible">;
    api_key_env: z.ZodString;
    base_url: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "openai-compatible";
    api_key_env: string;
    base_url: string;
}, {
    type: "openai-compatible";
    api_key_env: string;
    base_url: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"external-opencode">;
    username_env: z.ZodOptional<z.ZodString>;
    password_env: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "external-opencode";
    username_env?: string | undefined;
    password_env?: string | undefined;
}, {
    type: "external-opencode";
    username_env?: string | undefined;
    password_env?: string | undefined;
}>]>;
export declare const remoteAttestationTargetSchema: z.ZodObject<{
    type: z.ZodLiteral<"generic-http">;
    url: z.ZodString;
    token_env: z.ZodOptional<z.ZodString>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    headers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    type: "generic-http";
    url: string;
    enabled: boolean;
    headers: Record<string, string>;
    token_env?: string | undefined;
}, {
    type: "generic-http";
    url: string;
    token_env?: string | undefined;
    enabled?: boolean | undefined;
    headers?: Record<string, string> | undefined;
}>;
export declare const auditConfigSchema: z.ZodDefault<z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    schema_dir: z.ZodDefault<z.ZodString>;
    export_dir: z.ZodDefault<z.ZodString>;
    reviewer_directory_dir: z.ZodDefault<z.ZodString>;
    default_schema: z.ZodDefault<z.ZodString>;
    allow_custom_schemas: z.ZodDefault<z.ZodBoolean>;
    require_signed_audit_exports: z.ZodDefault<z.ZodBoolean>;
    include_raw_logs_by_default: z.ZodDefault<z.ZodBoolean>;
    max_export_bytes: z.ZodDefault<z.ZodNumber>;
    allowed_export_formats: z.ZodDefault<z.ZodArray<z.ZodEnum<["json", "markdown", "csv"]>, "many">>;
    compliance_language: z.ZodDefault<z.ZodObject<{
        avoid_certification_claims: z.ZodDefault<z.ZodBoolean>;
        use_control_mapping_terms: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        avoid_certification_claims: boolean;
        use_control_mapping_terms: boolean;
    }, {
        avoid_certification_claims?: boolean | undefined;
        use_control_mapping_terms?: boolean | undefined;
    }>>;
    retention: z.ZodDefault<z.ZodObject<{
        audit_export_retention_days: z.ZodDefault<z.ZodNumber>;
        legal_hold: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        audit_export_retention_days: number;
        legal_hold: boolean;
    }, {
        audit_export_retention_days?: number | undefined;
        legal_hold?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    schema_dir: string;
    export_dir: string;
    reviewer_directory_dir: string;
    default_schema: string;
    allow_custom_schemas: boolean;
    require_signed_audit_exports: boolean;
    include_raw_logs_by_default: boolean;
    max_export_bytes: number;
    allowed_export_formats: ("json" | "markdown" | "csv")[];
    compliance_language: {
        avoid_certification_claims: boolean;
        use_control_mapping_terms: boolean;
    };
    retention: {
        audit_export_retention_days: number;
        legal_hold: boolean;
    };
}, {
    enabled?: boolean | undefined;
    schema_dir?: string | undefined;
    export_dir?: string | undefined;
    reviewer_directory_dir?: string | undefined;
    default_schema?: string | undefined;
    allow_custom_schemas?: boolean | undefined;
    require_signed_audit_exports?: boolean | undefined;
    include_raw_logs_by_default?: boolean | undefined;
    max_export_bytes?: number | undefined;
    allowed_export_formats?: ("json" | "markdown" | "csv")[] | undefined;
    compliance_language?: {
        avoid_certification_claims?: boolean | undefined;
        use_control_mapping_terms?: boolean | undefined;
    } | undefined;
    retention?: {
        audit_export_retention_days?: number | undefined;
        legal_hold?: boolean | undefined;
    } | undefined;
}>>;
export declare const evidenceLifecycleConfigSchema: z.ZodDefault<z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    archive_dir: z.ZodDefault<z.ZodString>;
    lifecycle_dir: z.ZodDefault<z.ZodString>;
    retention_ledger_dir: z.ZodDefault<z.ZodString>;
    default_archive_mode: z.ZodDefault<z.ZodEnum<["minimal", "audit", "forensic_redacted"]>>;
    allowed_archive_modes: z.ZodDefault<z.ZodArray<z.ZodEnum<["minimal", "audit", "forensic_redacted"]>, "many">>;
    require_ledger_pass_for_archive: z.ZodDefault<z.ZodBoolean>;
    require_org_retention_plan_for_archive: z.ZodDefault<z.ZodBoolean>;
    require_signed_archive_manifest: z.ZodDefault<z.ZodBoolean>;
    allow_archive_without_release_packet: z.ZodDefault<z.ZodBoolean>;
    allow_archive_without_evidence_bundle: z.ZodDefault<z.ZodBoolean>;
    allow_compact_summary_bundle: z.ZodDefault<z.ZodBoolean>;
    delete_originals_after_archive: z.ZodDefault<z.ZodLiteral<false>>;
    purge_enabled: z.ZodDefault<z.ZodLiteral<false>>;
    max_archive_bytes: z.ZodDefault<z.ZodNumber>;
    redaction: z.ZodDefault<z.ZodObject<{
        exclude_private_keys: z.ZodDefault<z.ZodBoolean>;
        exclude_env_files: z.ZodDefault<z.ZodBoolean>;
        exclude_raw_provider_outputs: z.ZodDefault<z.ZodBoolean>;
        exclude_unbounded_command_logs: z.ZodDefault<z.ZodBoolean>;
        redact_secret_like_values: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        exclude_private_keys: boolean;
        exclude_env_files: boolean;
        exclude_raw_provider_outputs: boolean;
        exclude_unbounded_command_logs: boolean;
        redact_secret_like_values: boolean;
    }, {
        exclude_private_keys?: boolean | undefined;
        exclude_env_files?: boolean | undefined;
        exclude_raw_provider_outputs?: boolean | undefined;
        exclude_unbounded_command_logs?: boolean | undefined;
        redact_secret_like_values?: boolean | undefined;
    }>>;
    legal_hold: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        require_reason: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        require_reason: boolean;
    }, {
        enabled?: boolean | undefined;
        require_reason?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    legal_hold: {
        enabled: boolean;
        require_reason: boolean;
    };
    archive_dir: string;
    lifecycle_dir: string;
    retention_ledger_dir: string;
    default_archive_mode: "minimal" | "audit" | "forensic_redacted";
    allowed_archive_modes: ("minimal" | "audit" | "forensic_redacted")[];
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
}, {
    enabled?: boolean | undefined;
    legal_hold?: {
        enabled?: boolean | undefined;
        require_reason?: boolean | undefined;
    } | undefined;
    archive_dir?: string | undefined;
    lifecycle_dir?: string | undefined;
    retention_ledger_dir?: string | undefined;
    default_archive_mode?: "minimal" | "audit" | "forensic_redacted" | undefined;
    allowed_archive_modes?: ("minimal" | "audit" | "forensic_redacted")[] | undefined;
    require_ledger_pass_for_archive?: boolean | undefined;
    require_org_retention_plan_for_archive?: boolean | undefined;
    require_signed_archive_manifest?: boolean | undefined;
    allow_archive_without_release_packet?: boolean | undefined;
    allow_archive_without_evidence_bundle?: boolean | undefined;
    allow_compact_summary_bundle?: boolean | undefined;
    delete_originals_after_archive?: false | undefined;
    purge_enabled?: false | undefined;
    max_archive_bytes?: number | undefined;
    redaction?: {
        exclude_private_keys?: boolean | undefined;
        exclude_env_files?: boolean | undefined;
        exclude_raw_provider_outputs?: boolean | undefined;
        exclude_unbounded_command_logs?: boolean | undefined;
        redact_secret_like_values?: boolean | undefined;
    } | undefined;
}>>;
export declare const evidenceDisposalConfigSchema: z.ZodDefault<z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    disposal_dir: z.ZodDefault<z.ZodString>;
    require_retention_expired: z.ZodDefault<z.ZodBoolean>;
    require_no_legal_hold: z.ZodDefault<z.ZodBoolean>;
    require_archive_verified: z.ZodDefault<z.ZodBoolean>;
    require_retention_ledger: z.ZodDefault<z.ZodBoolean>;
    require_org_approval: z.ZodDefault<z.ZodBoolean>;
    require_disposal_attestation: z.ZodDefault<z.ZodBoolean>;
    delete_scope: z.ZodDefault<z.ZodLiteral<"run-evidence-only">>;
    allow_archive_deletion: z.ZodDefault<z.ZodLiteral<false>>;
    allow_key_deletion: z.ZodDefault<z.ZodLiteral<false>>;
    allow_source_deletion: z.ZodDefault<z.ZodLiteral<false>>;
    allow_remote_deletion: z.ZodDefault<z.ZodLiteral<false>>;
    allow_automatic_purge: z.ZodDefault<z.ZodLiteral<false>>;
    dry_run_by_default: z.ZodDefault<z.ZodLiteral<true>>;
    max_files_per_disposal: z.ZodDefault<z.ZodNumber>;
    max_bytes_per_disposal: z.ZodDefault<z.ZodNumber>;
    protected_classes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    receipt: z.ZodDefault<z.ZodObject<{
        require_sha256_before_delete: z.ZodDefault<z.ZodBoolean>;
        require_post_delete_verification: z.ZodDefault<z.ZodBoolean>;
        include_recovery_guidance: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        require_sha256_before_delete: boolean;
        require_post_delete_verification: boolean;
        include_recovery_guidance: boolean;
    }, {
        require_sha256_before_delete?: boolean | undefined;
        require_post_delete_verification?: boolean | undefined;
        include_recovery_guidance?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    disposal_dir: string;
    require_retention_expired: boolean;
    require_no_legal_hold: boolean;
    require_archive_verified: boolean;
    require_retention_ledger: boolean;
    require_org_approval: boolean;
    require_disposal_attestation: boolean;
    delete_scope: "run-evidence-only";
    allow_archive_deletion: false;
    allow_key_deletion: false;
    allow_source_deletion: false;
    allow_remote_deletion: false;
    allow_automatic_purge: false;
    dry_run_by_default: true;
    max_files_per_disposal: number;
    max_bytes_per_disposal: number;
    protected_classes: string[];
    receipt: {
        require_sha256_before_delete: boolean;
        require_post_delete_verification: boolean;
        include_recovery_guidance: boolean;
    };
}, {
    enabled?: boolean | undefined;
    disposal_dir?: string | undefined;
    require_retention_expired?: boolean | undefined;
    require_no_legal_hold?: boolean | undefined;
    require_archive_verified?: boolean | undefined;
    require_retention_ledger?: boolean | undefined;
    require_org_approval?: boolean | undefined;
    require_disposal_attestation?: boolean | undefined;
    delete_scope?: "run-evidence-only" | undefined;
    allow_archive_deletion?: false | undefined;
    allow_key_deletion?: false | undefined;
    allow_source_deletion?: false | undefined;
    allow_remote_deletion?: false | undefined;
    allow_automatic_purge?: false | undefined;
    dry_run_by_default?: true | undefined;
    max_files_per_disposal?: number | undefined;
    max_bytes_per_disposal?: number | undefined;
    protected_classes?: string[] | undefined;
    receipt?: {
        require_sha256_before_delete?: boolean | undefined;
        require_post_delete_verification?: boolean | undefined;
        include_recovery_guidance?: boolean | undefined;
    } | undefined;
}>>;
export declare const dogfoodConfigSchema: z.ZodDefault<z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    workspace_dir: z.ZodDefault<z.ZodString>;
    fixtures_dir: z.ZodDefault<z.ZodString>;
    reports_dir: z.ZodDefault<z.ZodString>;
    default_matrix: z.ZodDefault<z.ZodArray<z.ZodEnum<["node-package", "vite-react", "express-api", "nextjs-app", "python-package", "rust-crate", "solana-anchor-structural"]>, "many">>;
    allow_live_provider_smoke: z.ZodDefault<z.ZodBoolean>;
    require_live_confirmation: z.ZodDefault<z.ZodBoolean>;
    allow_fixture_patch_apply: z.ZodDefault<z.ZodBoolean>;
    allow_real_repo_patch_apply: z.ZodDefault<z.ZodBoolean>;
    max_fixture_runtime_ms: z.ZodDefault<z.ZodNumber>;
    max_total_runtime_ms: z.ZodDefault<z.ZodNumber>;
    max_report_bytes: z.ZodDefault<z.ZodNumber>;
    external_scanners: z.ZodDefault<z.ZodObject<{
        detect_only_by_default: z.ZodDefault<z.ZodBoolean>;
        allow_execution: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        detect_only_by_default: boolean;
        allow_execution: boolean;
    }, {
        detect_only_by_default?: boolean | undefined;
        allow_execution?: boolean | undefined;
    }>>;
    package_check: z.ZodDefault<z.ZodObject<{
        run_npm_pack: z.ZodDefault<z.ZodBoolean>;
        install_packed_cli_in_temp: z.ZodDefault<z.ZodBoolean>;
        run_packed_cli_smoke: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        run_npm_pack: boolean;
        install_packed_cli_in_temp: boolean;
        run_packed_cli_smoke: boolean;
    }, {
        run_npm_pack?: boolean | undefined;
        install_packed_cli_in_temp?: boolean | undefined;
        run_packed_cli_smoke?: boolean | undefined;
    }>>;
    safety: z.ZodDefault<z.ZodObject<{
        run_red_team_harness: z.ZodDefault<z.ZodBoolean>;
        block_network_by_default: z.ZodDefault<z.ZodBoolean>;
        redact_outputs: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        run_red_team_harness: boolean;
        block_network_by_default: boolean;
        redact_outputs: boolean;
    }, {
        run_red_team_harness?: boolean | undefined;
        block_network_by_default?: boolean | undefined;
        redact_outputs?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    workspace_dir: string;
    fixtures_dir: string;
    reports_dir: string;
    default_matrix: ("node-package" | "vite-react" | "express-api" | "nextjs-app" | "python-package" | "rust-crate" | "solana-anchor-structural")[];
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
}, {
    enabled?: boolean | undefined;
    workspace_dir?: string | undefined;
    fixtures_dir?: string | undefined;
    reports_dir?: string | undefined;
    default_matrix?: ("node-package" | "vite-react" | "express-api" | "nextjs-app" | "python-package" | "rust-crate" | "solana-anchor-structural")[] | undefined;
    allow_live_provider_smoke?: boolean | undefined;
    require_live_confirmation?: boolean | undefined;
    allow_fixture_patch_apply?: boolean | undefined;
    allow_real_repo_patch_apply?: boolean | undefined;
    max_fixture_runtime_ms?: number | undefined;
    max_total_runtime_ms?: number | undefined;
    max_report_bytes?: number | undefined;
    external_scanners?: {
        detect_only_by_default?: boolean | undefined;
        allow_execution?: boolean | undefined;
    } | undefined;
    package_check?: {
        run_npm_pack?: boolean | undefined;
        install_packed_cli_in_temp?: boolean | undefined;
        run_packed_cli_smoke?: boolean | undefined;
    } | undefined;
    safety?: {
        run_red_team_harness?: boolean | undefined;
        block_network_by_default?: boolean | undefined;
        redact_outputs?: boolean | undefined;
    } | undefined;
}>>;
export declare const betaConfigSchema: z.ZodDefault<z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    reports_dir: z.ZodDefault<z.ZodString>;
    trials_dir: z.ZodDefault<z.ZodString>;
    feedback_dir: z.ZodDefault<z.ZodString>;
    rc_dir: z.ZodDefault<z.ZodString>;
    default_channel: z.ZodDefault<z.ZodEnum<["private-beta", "closed-beta", "public-beta"]>>;
    allowed_channels: z.ZodDefault<z.ZodArray<z.ZodEnum<["private-beta", "closed-beta", "public-beta"]>, "many">>;
    gates: z.ZodDefault<z.ZodObject<{
        require_lint_pass: z.ZodDefault<z.ZodBoolean>;
        require_test_pass: z.ZodDefault<z.ZodBoolean>;
        require_build_pass: z.ZodDefault<z.ZodBoolean>;
        require_dogfood_pass: z.ZodDefault<z.ZodBoolean>;
        require_security_redteam_pass: z.ZodDefault<z.ZodBoolean>;
        require_package_check_pass: z.ZodDefault<z.ZodBoolean>;
        require_docs_check_pass: z.ZodDefault<z.ZodBoolean>;
        require_perf_check_pass: z.ZodDefault<z.ZodBoolean>;
        require_beta_backlog_no_blockers: z.ZodDefault<z.ZodBoolean>;
        require_dogfood_patch_apply_smoke: z.ZodDefault<z.ZodBoolean>;
        require_live_provider_smoke: z.ZodDefault<z.ZodBoolean>;
        require_external_scanners_installed: z.ZodDefault<z.ZodBoolean>;
        allow_accepted_warnings: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
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
    }, {
        require_lint_pass?: boolean | undefined;
        require_test_pass?: boolean | undefined;
        require_build_pass?: boolean | undefined;
        require_dogfood_pass?: boolean | undefined;
        require_security_redteam_pass?: boolean | undefined;
        require_package_check_pass?: boolean | undefined;
        require_docs_check_pass?: boolean | undefined;
        require_perf_check_pass?: boolean | undefined;
        require_beta_backlog_no_blockers?: boolean | undefined;
        require_dogfood_patch_apply_smoke?: boolean | undefined;
        require_live_provider_smoke?: boolean | undefined;
        require_external_scanners_installed?: boolean | undefined;
        allow_accepted_warnings?: boolean | undefined;
    }>>;
    warnings: z.ZodDefault<z.ZodObject<{
        max_accepted_warnings: z.ZodDefault<z.ZodNumber>;
        require_acceptance_reason: z.ZodDefault<z.ZodBoolean>;
        require_reviewer_for_acceptance: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        max_accepted_warnings: number;
        require_acceptance_reason: boolean;
        require_reviewer_for_acceptance: boolean;
    }, {
        max_accepted_warnings?: number | undefined;
        require_acceptance_reason?: boolean | undefined;
        require_reviewer_for_acceptance?: boolean | undefined;
    }>>;
    package: z.ZodDefault<z.ZodObject<{
        require_npm_pack: z.ZodDefault<z.ZodBoolean>;
        require_temp_install: z.ZodDefault<z.ZodBoolean>;
        require_compiled_cli_smoke: z.ZodDefault<z.ZodBoolean>;
        require_no_private_artifacts_in_package: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        require_npm_pack: boolean;
        require_temp_install: boolean;
        require_compiled_cli_smoke: boolean;
        require_no_private_artifacts_in_package: boolean;
    }, {
        require_npm_pack?: boolean | undefined;
        require_temp_install?: boolean | undefined;
        require_compiled_cli_smoke?: boolean | undefined;
        require_no_private_artifacts_in_package?: boolean | undefined;
    }>>;
    docs: z.ZodDefault<z.ZodObject<{
        strict_command_coverage: z.ZodDefault<z.ZodBoolean>;
        strict_confirmation_docs: z.ZodDefault<z.ZodBoolean>;
        forbid_unsupported_capability_claims: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        strict_command_coverage: boolean;
        strict_confirmation_docs: boolean;
        forbid_unsupported_capability_claims: boolean;
    }, {
        strict_command_coverage?: boolean | undefined;
        strict_confirmation_docs?: boolean | undefined;
        forbid_unsupported_capability_claims?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    docs: {
        strict_command_coverage: boolean;
        strict_confirmation_docs: boolean;
        forbid_unsupported_capability_claims: boolean;
    };
    package: {
        require_npm_pack: boolean;
        require_temp_install: boolean;
        require_compiled_cli_smoke: boolean;
        require_no_private_artifacts_in_package: boolean;
    };
    enabled: boolean;
    reports_dir: string;
    trials_dir: string;
    feedback_dir: string;
    rc_dir: string;
    default_channel: "private-beta" | "closed-beta" | "public-beta";
    allowed_channels: ("private-beta" | "closed-beta" | "public-beta")[];
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
}, {
    docs?: {
        strict_command_coverage?: boolean | undefined;
        strict_confirmation_docs?: boolean | undefined;
        forbid_unsupported_capability_claims?: boolean | undefined;
    } | undefined;
    package?: {
        require_npm_pack?: boolean | undefined;
        require_temp_install?: boolean | undefined;
        require_compiled_cli_smoke?: boolean | undefined;
        require_no_private_artifacts_in_package?: boolean | undefined;
    } | undefined;
    enabled?: boolean | undefined;
    reports_dir?: string | undefined;
    trials_dir?: string | undefined;
    feedback_dir?: string | undefined;
    rc_dir?: string | undefined;
    default_channel?: "private-beta" | "closed-beta" | "public-beta" | undefined;
    allowed_channels?: ("private-beta" | "closed-beta" | "public-beta")[] | undefined;
    gates?: {
        require_lint_pass?: boolean | undefined;
        require_test_pass?: boolean | undefined;
        require_build_pass?: boolean | undefined;
        require_dogfood_pass?: boolean | undefined;
        require_security_redteam_pass?: boolean | undefined;
        require_package_check_pass?: boolean | undefined;
        require_docs_check_pass?: boolean | undefined;
        require_perf_check_pass?: boolean | undefined;
        require_beta_backlog_no_blockers?: boolean | undefined;
        require_dogfood_patch_apply_smoke?: boolean | undefined;
        require_live_provider_smoke?: boolean | undefined;
        require_external_scanners_installed?: boolean | undefined;
        allow_accepted_warnings?: boolean | undefined;
    } | undefined;
    warnings?: {
        max_accepted_warnings?: number | undefined;
        require_acceptance_reason?: boolean | undefined;
        require_reviewer_for_acceptance?: boolean | undefined;
    } | undefined;
}>>;
export declare const organizationConfigSchema: z.ZodDefault<z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    org_id: z.ZodDefault<z.ZodString>;
    org_name: z.ZodDefault<z.ZodString>;
    policy_bundle_dir: z.ZodDefault<z.ZodString>;
    key_dir: z.ZodDefault<z.ZodString>;
    audit_log_dir: z.ZodDefault<z.ZodString>;
    require_signed_policy_bundle: z.ZodDefault<z.ZodBoolean>;
    require_multi_reviewer_approval_for_release: z.ZodDefault<z.ZodBoolean>;
    require_remote_receipt_refresh_for_release: z.ZodDefault<z.ZodBoolean>;
    require_retention_plan_for_release: z.ZodDefault<z.ZodBoolean>;
    default_approval_policy: z.ZodDefault<z.ZodString>;
    reviewers: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        display_name: z.ZodString;
        roles: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        display_name: string;
        roles: string[];
    }, {
        id: string;
        display_name: string;
        roles?: string[] | undefined;
    }>, "many">>;
    approval_policies: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodObject<{
        min_approvals: z.ZodNumber;
        required_roles: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        disallow_self_approval: z.ZodDefault<z.ZodBoolean>;
        require_distinct_reviewers: z.ZodDefault<z.ZodBoolean>;
        allow_needs_changes: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        min_approvals: number;
        required_roles: string[];
        disallow_self_approval: boolean;
        require_distinct_reviewers: boolean;
        allow_needs_changes: boolean;
    }, {
        min_approvals: number;
        required_roles?: string[] | undefined;
        disallow_self_approval?: boolean | undefined;
        require_distinct_reviewers?: boolean | undefined;
        allow_needs_changes?: boolean | undefined;
    }>>>;
    retention: z.ZodDefault<z.ZodObject<{
        default_policy: z.ZodDefault<z.ZodString>;
        policies: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodObject<{
            retention_days: z.ZodNullable<z.ZodNumber>;
            legal_hold: z.ZodDefault<z.ZodBoolean>;
            export_mode: z.ZodDefault<z.ZodEnum<["minimal", "audit", "forensic_redacted"]>>;
        }, "strip", z.ZodTypeAny, {
            legal_hold: boolean;
            retention_days: number | null;
            export_mode: "minimal" | "audit" | "forensic_redacted";
        }, {
            retention_days: number | null;
            legal_hold?: boolean | undefined;
            export_mode?: "minimal" | "audit" | "forensic_redacted" | undefined;
        }>>>;
    }, "strip", z.ZodTypeAny, {
        default_policy: string;
        policies: Record<string, {
            legal_hold: boolean;
            retention_days: number | null;
            export_mode: "minimal" | "audit" | "forensic_redacted";
        }>;
    }, {
        default_policy?: string | undefined;
        policies?: Record<string, {
            retention_days: number | null;
            legal_hold?: boolean | undefined;
            export_mode?: "minimal" | "audit" | "forensic_redacted" | undefined;
        }> | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    retention: {
        default_policy: string;
        policies: Record<string, {
            legal_hold: boolean;
            retention_days: number | null;
            export_mode: "minimal" | "audit" | "forensic_redacted";
        }>;
    };
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
    reviewers: {
        id: string;
        display_name: string;
        roles: string[];
    }[];
    approval_policies: Record<string, {
        min_approvals: number;
        required_roles: string[];
        disallow_self_approval: boolean;
        require_distinct_reviewers: boolean;
        allow_needs_changes: boolean;
    }>;
}, {
    enabled?: boolean | undefined;
    retention?: {
        default_policy?: string | undefined;
        policies?: Record<string, {
            retention_days: number | null;
            legal_hold?: boolean | undefined;
            export_mode?: "minimal" | "audit" | "forensic_redacted" | undefined;
        }> | undefined;
    } | undefined;
    org_id?: string | undefined;
    org_name?: string | undefined;
    policy_bundle_dir?: string | undefined;
    key_dir?: string | undefined;
    audit_log_dir?: string | undefined;
    require_signed_policy_bundle?: boolean | undefined;
    require_multi_reviewer_approval_for_release?: boolean | undefined;
    require_remote_receipt_refresh_for_release?: boolean | undefined;
    require_retention_plan_for_release?: boolean | undefined;
    default_approval_policy?: string | undefined;
    reviewers?: {
        id: string;
        display_name: string;
        roles?: string[] | undefined;
    }[] | undefined;
    approval_policies?: Record<string, {
        min_approvals: number;
        required_roles?: string[] | undefined;
        disallow_self_approval?: boolean | undefined;
        require_distinct_reviewers?: boolean | undefined;
        allow_needs_changes?: boolean | undefined;
    }> | undefined;
}>>;
export declare const agentConfigSchema: z.ZodEffects<z.ZodObject<{
    provider: z.ZodString;
    model: z.ZodOptional<z.ZodString>;
    model_alias: z.ZodOptional<z.ZodString>;
    fallback_models: z.ZodOptional<z.ZodArray<z.ZodObject<{
        provider: z.ZodOptional<z.ZodString>;
        model: z.ZodOptional<z.ZodString>;
        model_alias: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        provider?: string | undefined;
        model?: string | undefined;
        model_alias?: string | undefined;
    }, {
        provider?: string | undefined;
        model?: string | undefined;
        model_alias?: string | undefined;
    }>, "many">>;
    can_write_files: z.ZodBoolean;
    can_run_commands: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    provider: string;
    can_write_files: boolean;
    can_run_commands: boolean;
    model?: string | undefined;
    model_alias?: string | undefined;
    fallback_models?: {
        provider?: string | undefined;
        model?: string | undefined;
        model_alias?: string | undefined;
    }[] | undefined;
}, {
    provider: string;
    can_write_files: boolean;
    can_run_commands: boolean;
    model?: string | undefined;
    model_alias?: string | undefined;
    fallback_models?: {
        provider?: string | undefined;
        model?: string | undefined;
        model_alias?: string | undefined;
    }[] | undefined;
}>, {
    provider: string;
    can_write_files: boolean;
    can_run_commands: boolean;
    model?: string | undefined;
    model_alias?: string | undefined;
    fallback_models?: {
        provider?: string | undefined;
        model?: string | undefined;
        model_alias?: string | undefined;
    }[] | undefined;
}, {
    provider: string;
    can_write_files: boolean;
    can_run_commands: boolean;
    model?: string | undefined;
    model_alias?: string | undefined;
    fallback_models?: {
        provider?: string | undefined;
        model?: string | undefined;
        model_alias?: string | undefined;
    }[] | undefined;
}>;
export declare const configSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    default_profile: z.ZodString;
    providers: z.ZodRecord<z.ZodString, z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"openrouter">;
        api_key_env: z.ZodString;
        base_url: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "openrouter";
        api_key_env: string;
        base_url: string;
    }, {
        type: "openrouter";
        api_key_env: string;
        base_url?: string | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"openai-compatible">;
        api_key_env: z.ZodString;
        base_url: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "openai-compatible";
        api_key_env: string;
        base_url: string;
    }, {
        type: "openai-compatible";
        api_key_env: string;
        base_url: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"external-opencode">;
        username_env: z.ZodOptional<z.ZodString>;
        password_env: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "external-opencode";
        username_env?: string | undefined;
        password_env?: string | undefined;
    }, {
        type: "external-opencode";
        username_env?: string | undefined;
        password_env?: string | undefined;
    }>]>>;
    profiles: z.ZodRecord<z.ZodString, z.ZodObject<{
        agents: z.ZodRecord<z.ZodString, z.ZodEffects<z.ZodObject<{
            provider: z.ZodString;
            model: z.ZodOptional<z.ZodString>;
            model_alias: z.ZodOptional<z.ZodString>;
            fallback_models: z.ZodOptional<z.ZodArray<z.ZodObject<{
                provider: z.ZodOptional<z.ZodString>;
                model: z.ZodOptional<z.ZodString>;
                model_alias: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                provider?: string | undefined;
                model?: string | undefined;
                model_alias?: string | undefined;
            }, {
                provider?: string | undefined;
                model?: string | undefined;
                model_alias?: string | undefined;
            }>, "many">>;
            can_write_files: z.ZodBoolean;
            can_run_commands: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            provider: string;
            can_write_files: boolean;
            can_run_commands: boolean;
            model?: string | undefined;
            model_alias?: string | undefined;
            fallback_models?: {
                provider?: string | undefined;
                model?: string | undefined;
                model_alias?: string | undefined;
            }[] | undefined;
        }, {
            provider: string;
            can_write_files: boolean;
            can_run_commands: boolean;
            model?: string | undefined;
            model_alias?: string | undefined;
            fallback_models?: {
                provider?: string | undefined;
                model?: string | undefined;
                model_alias?: string | undefined;
            }[] | undefined;
        }>, {
            provider: string;
            can_write_files: boolean;
            can_run_commands: boolean;
            model?: string | undefined;
            model_alias?: string | undefined;
            fallback_models?: {
                provider?: string | undefined;
                model?: string | undefined;
                model_alias?: string | undefined;
            }[] | undefined;
        }, {
            provider: string;
            can_write_files: boolean;
            can_run_commands: boolean;
            model?: string | undefined;
            model_alias?: string | undefined;
            fallback_models?: {
                provider?: string | undefined;
                model?: string | undefined;
                model_alias?: string | undefined;
            }[] | undefined;
        }>>;
        routing_strategy: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        agents: Record<string, {
            provider: string;
            can_write_files: boolean;
            can_run_commands: boolean;
            model?: string | undefined;
            model_alias?: string | undefined;
            fallback_models?: {
                provider?: string | undefined;
                model?: string | undefined;
                model_alias?: string | undefined;
            }[] | undefined;
        }>;
        routing_strategy?: string | undefined;
    }, {
        agents: Record<string, {
            provider: string;
            can_write_files: boolean;
            can_run_commands: boolean;
            model?: string | undefined;
            model_alias?: string | undefined;
            fallback_models?: {
                provider?: string | undefined;
                model?: string | undefined;
                model_alias?: string | undefined;
            }[] | undefined;
        }>;
        routing_strategy?: string | undefined;
    }>>;
    routing: z.ZodDefault<z.ZodObject<{
        default_strategy: z.ZodDefault<z.ZodString>;
        strategies: z.ZodRecord<z.ZodString, z.ZodObject<{
            prefer: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            max_model_cost_tier: z.ZodOptional<z.ZodEnum<["free", "low", "medium", "high", "unknown"]>>;
            allow_fallback: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            prefer: string[];
            allow_fallback: boolean;
            max_model_cost_tier?: "unknown" | "low" | "medium" | "high" | "free" | undefined;
        }, {
            prefer?: string[] | undefined;
            max_model_cost_tier?: "unknown" | "low" | "medium" | "high" | "free" | undefined;
            allow_fallback?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        default_strategy: string;
        strategies: Record<string, {
            prefer: string[];
            allow_fallback: boolean;
            max_model_cost_tier?: "unknown" | "low" | "medium" | "high" | "free" | undefined;
        }>;
    }, {
        strategies: Record<string, {
            prefer?: string[] | undefined;
            max_model_cost_tier?: "unknown" | "low" | "medium" | "high" | "free" | undefined;
            allow_fallback?: boolean | undefined;
        }>;
        default_strategy?: string | undefined;
    }>>;
    model_aliases: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodObject<{
        provider: z.ZodString;
        model: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        provider: string;
        model: string;
    }, {
        provider: string;
        model: string;
    }>>>;
    budget: z.ZodObject<{
        max_run_cost_usd: z.ZodNumber;
        max_agent_cost_usd: z.ZodOptional<z.ZodNumber>;
        max_repair_cost_usd: z.ZodOptional<z.ZodNumber>;
        max_live_agents_per_run: z.ZodOptional<z.ZodNumber>;
        max_stream_tokens_per_agent: z.ZodOptional<z.ZodNumber>;
        max_total_tokens_per_run: z.ZodOptional<z.ZodNumber>;
        stop_on_budget_risk: z.ZodDefault<z.ZodBoolean>;
        max_repair_cycles_per_gate: z.ZodNumber;
        max_parallel_agents: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        max_run_cost_usd: number;
        stop_on_budget_risk: boolean;
        max_repair_cycles_per_gate: number;
        max_parallel_agents: number;
        max_agent_cost_usd?: number | undefined;
        max_repair_cost_usd?: number | undefined;
        max_live_agents_per_run?: number | undefined;
        max_stream_tokens_per_agent?: number | undefined;
        max_total_tokens_per_run?: number | undefined;
    }, {
        max_run_cost_usd: number;
        max_repair_cycles_per_gate: number;
        max_parallel_agents: number;
        max_agent_cost_usd?: number | undefined;
        max_repair_cost_usd?: number | undefined;
        max_live_agents_per_run?: number | undefined;
        max_stream_tokens_per_agent?: number | undefined;
        max_total_tokens_per_run?: number | undefined;
        stop_on_budget_risk?: boolean | undefined;
    }>;
    provider_runtime: z.ZodDefault<z.ZodObject<{
        request_timeout_ms: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        request_timeout_ms: number;
    }, {
        request_timeout_ms?: number | undefined;
    }>>;
    command_runtime: z.ZodDefault<z.ZodObject<{
        command_timeout_ms: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        command_timeout_ms: number;
    }, {
        command_timeout_ms?: number | undefined;
    }>>;
    git_lifecycle: z.ZodDefault<z.ZodObject<{
        branch_prefix: z.ZodDefault<z.ZodString>;
        commit_style: z.ZodDefault<z.ZodEnum<["conventional", "plain"]>>;
        protected_branches: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        allow_commit_on_protected_branch: z.ZodDefault<z.ZodBoolean>;
        require_applied_before_commit: z.ZodDefault<z.ZodBoolean>;
        require_verification_before_commit: z.ZodDefault<z.ZodBoolean>;
        require_ledger_pass_before_commit: z.ZodDefault<z.ZodBoolean>;
        require_scanner_no_high_or_critical_before_commit: z.ZodDefault<z.ZodBoolean>;
        stage_only_applied_files: z.ZodDefault<z.ZodBoolean>;
        include_handoff_artifacts_by_default: z.ZodDefault<z.ZodBoolean>;
        allow_dirty_worktree_for_branch_create: z.ZodDefault<z.ZodBoolean>;
        allow_dirty_worktree_for_commit: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        branch_prefix: string;
        commit_style: "conventional" | "plain";
        protected_branches: string[];
        allow_commit_on_protected_branch: boolean;
        require_applied_before_commit: boolean;
        require_verification_before_commit: boolean;
        require_ledger_pass_before_commit: boolean;
        require_scanner_no_high_or_critical_before_commit: boolean;
        stage_only_applied_files: boolean;
        include_handoff_artifacts_by_default: boolean;
        allow_dirty_worktree_for_branch_create: boolean;
        allow_dirty_worktree_for_commit: boolean;
    }, {
        branch_prefix?: string | undefined;
        commit_style?: "conventional" | "plain" | undefined;
        protected_branches?: string[] | undefined;
        allow_commit_on_protected_branch?: boolean | undefined;
        require_applied_before_commit?: boolean | undefined;
        require_verification_before_commit?: boolean | undefined;
        require_ledger_pass_before_commit?: boolean | undefined;
        require_scanner_no_high_or_critical_before_commit?: boolean | undefined;
        stage_only_applied_files?: boolean | undefined;
        include_handoff_artifacts_by_default?: boolean | undefined;
        allow_dirty_worktree_for_branch_create?: boolean | undefined;
        allow_dirty_worktree_for_commit?: boolean | undefined;
    }>>;
    release: z.ZodDefault<z.ZodObject<{
        default_channel: z.ZodDefault<z.ZodString>;
        allowed_channels: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        versioning: z.ZodDefault<z.ZodObject<{
            strategy: z.ZodDefault<z.ZodLiteral<"semver">>;
            allow_prerelease: z.ZodDefault<z.ZodBoolean>;
            prerelease_identifiers: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            strategy: "semver";
            allow_prerelease: boolean;
            prerelease_identifiers: string[];
        }, {
            strategy?: "semver" | undefined;
            allow_prerelease?: boolean | undefined;
            prerelease_identifiers?: string[] | undefined;
        }>>;
        changelog: z.ZodDefault<z.ZodObject<{
            file: z.ZodDefault<z.ZodString>;
            style: z.ZodDefault<z.ZodLiteral<"keepachangelog">>;
            include_vibecli_footer: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            file: string;
            style: "keepachangelog";
            include_vibecli_footer: boolean;
        }, {
            file?: string | undefined;
            style?: "keepachangelog" | undefined;
            include_vibecli_footer?: boolean | undefined;
        }>>;
        release_branch: z.ZodDefault<z.ZodObject<{
            prefix: z.ZodDefault<z.ZodString>;
            protected_target_branches: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            prefix: string;
            protected_target_branches: string[];
        }, {
            prefix?: string | undefined;
            protected_target_branches?: string[] | undefined;
        }>>;
        tags: z.ZodDefault<z.ZodObject<{
            prefix: z.ZodDefault<z.ZodString>;
            annotated: z.ZodDefault<z.ZodBoolean>;
            allow_tag_on_dirty_worktree: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            prefix: string;
            annotated: boolean;
            allow_tag_on_dirty_worktree: boolean;
        }, {
            prefix?: string | undefined;
            annotated?: boolean | undefined;
            allow_tag_on_dirty_worktree?: boolean | undefined;
        }>>;
        ci: z.ZodDefault<z.ZodObject<{
            providers: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            require_ci_pass_for_production: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            providers: string[];
            require_ci_pass_for_production: boolean;
        }, {
            providers?: string[] | undefined;
            require_ci_pass_for_production?: boolean | undefined;
        }>>;
        deployment: z.ZodDefault<z.ZodObject<{
            require_deployment_readiness_for_production: z.ZodDefault<z.ZodBoolean>;
            execute_deploy_commands: z.ZodDefault<z.ZodLiteral<false>>;
        }, "strip", z.ZodTypeAny, {
            require_deployment_readiness_for_production: boolean;
            execute_deploy_commands: false;
        }, {
            require_deployment_readiness_for_production?: boolean | undefined;
            execute_deploy_commands?: false | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        default_channel: string;
        allowed_channels: string[];
        versioning: {
            strategy: "semver";
            allow_prerelease: boolean;
            prerelease_identifiers: string[];
        };
        changelog: {
            file: string;
            style: "keepachangelog";
            include_vibecli_footer: boolean;
        };
        release_branch: {
            prefix: string;
            protected_target_branches: string[];
        };
        tags: {
            prefix: string;
            annotated: boolean;
            allow_tag_on_dirty_worktree: boolean;
        };
        ci: {
            providers: string[];
            require_ci_pass_for_production: boolean;
        };
        deployment: {
            require_deployment_readiness_for_production: boolean;
            execute_deploy_commands: false;
        };
    }, {
        default_channel?: string | undefined;
        allowed_channels?: string[] | undefined;
        versioning?: {
            strategy?: "semver" | undefined;
            allow_prerelease?: boolean | undefined;
            prerelease_identifiers?: string[] | undefined;
        } | undefined;
        changelog?: {
            file?: string | undefined;
            style?: "keepachangelog" | undefined;
            include_vibecli_footer?: boolean | undefined;
        } | undefined;
        release_branch?: {
            prefix?: string | undefined;
            protected_target_branches?: string[] | undefined;
        } | undefined;
        tags?: {
            prefix?: string | undefined;
            annotated?: boolean | undefined;
            allow_tag_on_dirty_worktree?: boolean | undefined;
        } | undefined;
        ci?: {
            providers?: string[] | undefined;
            require_ci_pass_for_production?: boolean | undefined;
        } | undefined;
        deployment?: {
            require_deployment_readiness_for_production?: boolean | undefined;
            execute_deploy_commands?: false | undefined;
        } | undefined;
    }>>;
    provenance: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        format: z.ZodDefault<z.ZodLiteral<"slsa-inspired">>;
        signing: z.ZodDefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            algorithm: z.ZodDefault<z.ZodLiteral<"ed25519">>;
            key_dir: z.ZodDefault<z.ZodString>;
            private_key_file: z.ZodDefault<z.ZodString>;
            public_key_file: z.ZodDefault<z.ZodString>;
            require_local_key_for_signing: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            key_dir: string;
            algorithm: "ed25519";
            private_key_file: string;
            public_key_file: string;
            require_local_key_for_signing: boolean;
        }, {
            enabled?: boolean | undefined;
            key_dir?: string | undefined;
            algorithm?: "ed25519" | undefined;
            private_key_file?: string | undefined;
            public_key_file?: string | undefined;
            require_local_key_for_signing?: boolean | undefined;
        }>>;
        evidence: z.ZodDefault<z.ZodObject<{
            include_release_packet: z.ZodDefault<z.ZodBoolean>;
            include_handoff_summary: z.ZodDefault<z.ZodBoolean>;
            include_ledger_manifest: z.ZodDefault<z.ZodBoolean>;
            include_verification_results: z.ZodDefault<z.ZodBoolean>;
            include_scanner_results: z.ZodDefault<z.ZodBoolean>;
            include_ci_status: z.ZodDefault<z.ZodBoolean>;
            include_deployment_readiness: z.ZodDefault<z.ZodBoolean>;
            include_git_lifecycle: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            include_release_packet: boolean;
            include_handoff_summary: boolean;
            include_ledger_manifest: boolean;
            include_verification_results: boolean;
            include_scanner_results: boolean;
            include_ci_status: boolean;
            include_deployment_readiness: boolean;
            include_git_lifecycle: boolean;
        }, {
            include_release_packet?: boolean | undefined;
            include_handoff_summary?: boolean | undefined;
            include_ledger_manifest?: boolean | undefined;
            include_verification_results?: boolean | undefined;
            include_scanner_results?: boolean | undefined;
            include_ci_status?: boolean | undefined;
            include_deployment_readiness?: boolean | undefined;
            include_git_lifecycle?: boolean | undefined;
        }>>;
        github_release: z.ZodDefault<z.ZodObject<{
            allow_draft_creation: z.ZodDefault<z.ZodBoolean>;
            publish_releases: z.ZodDefault<z.ZodLiteral<false>>;
            upload_assets: z.ZodDefault<z.ZodLiteral<false>>;
            require_existing_remote_tag: z.ZodDefault<z.ZodBoolean>;
            require_release_readiness_for_draft: z.ZodDefault<z.ZodBoolean>;
            require_release_readiness_for_production_draft: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            allow_draft_creation: boolean;
            publish_releases: false;
            upload_assets: false;
            require_existing_remote_tag: boolean;
            require_release_readiness_for_draft: boolean;
            require_release_readiness_for_production_draft: boolean;
        }, {
            allow_draft_creation?: boolean | undefined;
            publish_releases?: false | undefined;
            upload_assets?: false | undefined;
            require_existing_remote_tag?: boolean | undefined;
            require_release_readiness_for_draft?: boolean | undefined;
            require_release_readiness_for_production_draft?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        format: "slsa-inspired";
        signing: {
            enabled: boolean;
            key_dir: string;
            algorithm: "ed25519";
            private_key_file: string;
            public_key_file: string;
            require_local_key_for_signing: boolean;
        };
        evidence: {
            include_release_packet: boolean;
            include_handoff_summary: boolean;
            include_ledger_manifest: boolean;
            include_verification_results: boolean;
            include_scanner_results: boolean;
            include_ci_status: boolean;
            include_deployment_readiness: boolean;
            include_git_lifecycle: boolean;
        };
        github_release: {
            allow_draft_creation: boolean;
            publish_releases: false;
            upload_assets: false;
            require_existing_remote_tag: boolean;
            require_release_readiness_for_draft: boolean;
            require_release_readiness_for_production_draft: boolean;
        };
    }, {
        enabled?: boolean | undefined;
        format?: "slsa-inspired" | undefined;
        signing?: {
            enabled?: boolean | undefined;
            key_dir?: string | undefined;
            algorithm?: "ed25519" | undefined;
            private_key_file?: string | undefined;
            public_key_file?: string | undefined;
            require_local_key_for_signing?: boolean | undefined;
        } | undefined;
        evidence?: {
            include_release_packet?: boolean | undefined;
            include_handoff_summary?: boolean | undefined;
            include_ledger_manifest?: boolean | undefined;
            include_verification_results?: boolean | undefined;
            include_scanner_results?: boolean | undefined;
            include_ci_status?: boolean | undefined;
            include_deployment_readiness?: boolean | undefined;
            include_git_lifecycle?: boolean | undefined;
        } | undefined;
        github_release?: {
            allow_draft_creation?: boolean | undefined;
            publish_releases?: false | undefined;
            upload_assets?: false | undefined;
            require_existing_remote_tag?: boolean | undefined;
            require_release_readiness_for_draft?: boolean | undefined;
            require_release_readiness_for_production_draft?: boolean | undefined;
        } | undefined;
    }>>;
    remote_attestation: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        allow_remote_submission: z.ZodDefault<z.ZodBoolean>;
        require_exact_confirmation: z.ZodDefault<z.ZodBoolean>;
        require_signed_provenance: z.ZodDefault<z.ZodBoolean>;
        require_evidence_bundle: z.ZodDefault<z.ZodBoolean>;
        require_ledger_pass: z.ZodDefault<z.ZodBoolean>;
        require_release_packet: z.ZodDefault<z.ZodBoolean>;
        require_https_targets: z.ZodDefault<z.ZodBoolean>;
        allow_localhost_targets: z.ZodDefault<z.ZodBoolean>;
        max_payload_bytes: z.ZodDefault<z.ZodNumber>;
        request_timeout_ms: z.ZodDefault<z.ZodNumber>;
        send_metadata_only: z.ZodDefault<z.ZodBoolean>;
        include_evidence_archive_by_default: z.ZodDefault<z.ZodBoolean>;
        targets: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodObject<{
            type: z.ZodLiteral<"generic-http">;
            url: z.ZodString;
            token_env: z.ZodOptional<z.ZodString>;
            enabled: z.ZodDefault<z.ZodBoolean>;
            headers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            type: "generic-http";
            url: string;
            enabled: boolean;
            headers: Record<string, string>;
            token_env?: string | undefined;
        }, {
            type: "generic-http";
            url: string;
            token_env?: string | undefined;
            enabled?: boolean | undefined;
            headers?: Record<string, string> | undefined;
        }>>>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        request_timeout_ms: number;
        allow_remote_submission: boolean;
        require_exact_confirmation: boolean;
        require_signed_provenance: boolean;
        require_evidence_bundle: boolean;
        require_ledger_pass: boolean;
        require_release_packet: boolean;
        require_https_targets: boolean;
        allow_localhost_targets: boolean;
        max_payload_bytes: number;
        send_metadata_only: boolean;
        include_evidence_archive_by_default: boolean;
        targets: Record<string, {
            type: "generic-http";
            url: string;
            enabled: boolean;
            headers: Record<string, string>;
            token_env?: string | undefined;
        }>;
    }, {
        enabled?: boolean | undefined;
        request_timeout_ms?: number | undefined;
        allow_remote_submission?: boolean | undefined;
        require_exact_confirmation?: boolean | undefined;
        require_signed_provenance?: boolean | undefined;
        require_evidence_bundle?: boolean | undefined;
        require_ledger_pass?: boolean | undefined;
        require_release_packet?: boolean | undefined;
        require_https_targets?: boolean | undefined;
        allow_localhost_targets?: boolean | undefined;
        max_payload_bytes?: number | undefined;
        send_metadata_only?: boolean | undefined;
        include_evidence_archive_by_default?: boolean | undefined;
        targets?: Record<string, {
            type: "generic-http";
            url: string;
            token_env?: string | undefined;
            enabled?: boolean | undefined;
            headers?: Record<string, string> | undefined;
        }> | undefined;
    }>>;
    audit: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        schema_dir: z.ZodDefault<z.ZodString>;
        export_dir: z.ZodDefault<z.ZodString>;
        reviewer_directory_dir: z.ZodDefault<z.ZodString>;
        default_schema: z.ZodDefault<z.ZodString>;
        allow_custom_schemas: z.ZodDefault<z.ZodBoolean>;
        require_signed_audit_exports: z.ZodDefault<z.ZodBoolean>;
        include_raw_logs_by_default: z.ZodDefault<z.ZodBoolean>;
        max_export_bytes: z.ZodDefault<z.ZodNumber>;
        allowed_export_formats: z.ZodDefault<z.ZodArray<z.ZodEnum<["json", "markdown", "csv"]>, "many">>;
        compliance_language: z.ZodDefault<z.ZodObject<{
            avoid_certification_claims: z.ZodDefault<z.ZodBoolean>;
            use_control_mapping_terms: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            avoid_certification_claims: boolean;
            use_control_mapping_terms: boolean;
        }, {
            avoid_certification_claims?: boolean | undefined;
            use_control_mapping_terms?: boolean | undefined;
        }>>;
        retention: z.ZodDefault<z.ZodObject<{
            audit_export_retention_days: z.ZodDefault<z.ZodNumber>;
            legal_hold: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            audit_export_retention_days: number;
            legal_hold: boolean;
        }, {
            audit_export_retention_days?: number | undefined;
            legal_hold?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        schema_dir: string;
        export_dir: string;
        reviewer_directory_dir: string;
        default_schema: string;
        allow_custom_schemas: boolean;
        require_signed_audit_exports: boolean;
        include_raw_logs_by_default: boolean;
        max_export_bytes: number;
        allowed_export_formats: ("json" | "markdown" | "csv")[];
        compliance_language: {
            avoid_certification_claims: boolean;
            use_control_mapping_terms: boolean;
        };
        retention: {
            audit_export_retention_days: number;
            legal_hold: boolean;
        };
    }, {
        enabled?: boolean | undefined;
        schema_dir?: string | undefined;
        export_dir?: string | undefined;
        reviewer_directory_dir?: string | undefined;
        default_schema?: string | undefined;
        allow_custom_schemas?: boolean | undefined;
        require_signed_audit_exports?: boolean | undefined;
        include_raw_logs_by_default?: boolean | undefined;
        max_export_bytes?: number | undefined;
        allowed_export_formats?: ("json" | "markdown" | "csv")[] | undefined;
        compliance_language?: {
            avoid_certification_claims?: boolean | undefined;
            use_control_mapping_terms?: boolean | undefined;
        } | undefined;
        retention?: {
            audit_export_retention_days?: number | undefined;
            legal_hold?: boolean | undefined;
        } | undefined;
    }>>;
    evidence_lifecycle: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        archive_dir: z.ZodDefault<z.ZodString>;
        lifecycle_dir: z.ZodDefault<z.ZodString>;
        retention_ledger_dir: z.ZodDefault<z.ZodString>;
        default_archive_mode: z.ZodDefault<z.ZodEnum<["minimal", "audit", "forensic_redacted"]>>;
        allowed_archive_modes: z.ZodDefault<z.ZodArray<z.ZodEnum<["minimal", "audit", "forensic_redacted"]>, "many">>;
        require_ledger_pass_for_archive: z.ZodDefault<z.ZodBoolean>;
        require_org_retention_plan_for_archive: z.ZodDefault<z.ZodBoolean>;
        require_signed_archive_manifest: z.ZodDefault<z.ZodBoolean>;
        allow_archive_without_release_packet: z.ZodDefault<z.ZodBoolean>;
        allow_archive_without_evidence_bundle: z.ZodDefault<z.ZodBoolean>;
        allow_compact_summary_bundle: z.ZodDefault<z.ZodBoolean>;
        delete_originals_after_archive: z.ZodDefault<z.ZodLiteral<false>>;
        purge_enabled: z.ZodDefault<z.ZodLiteral<false>>;
        max_archive_bytes: z.ZodDefault<z.ZodNumber>;
        redaction: z.ZodDefault<z.ZodObject<{
            exclude_private_keys: z.ZodDefault<z.ZodBoolean>;
            exclude_env_files: z.ZodDefault<z.ZodBoolean>;
            exclude_raw_provider_outputs: z.ZodDefault<z.ZodBoolean>;
            exclude_unbounded_command_logs: z.ZodDefault<z.ZodBoolean>;
            redact_secret_like_values: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            exclude_private_keys: boolean;
            exclude_env_files: boolean;
            exclude_raw_provider_outputs: boolean;
            exclude_unbounded_command_logs: boolean;
            redact_secret_like_values: boolean;
        }, {
            exclude_private_keys?: boolean | undefined;
            exclude_env_files?: boolean | undefined;
            exclude_raw_provider_outputs?: boolean | undefined;
            exclude_unbounded_command_logs?: boolean | undefined;
            redact_secret_like_values?: boolean | undefined;
        }>>;
        legal_hold: z.ZodDefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            require_reason: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            require_reason: boolean;
        }, {
            enabled?: boolean | undefined;
            require_reason?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        legal_hold: {
            enabled: boolean;
            require_reason: boolean;
        };
        archive_dir: string;
        lifecycle_dir: string;
        retention_ledger_dir: string;
        default_archive_mode: "minimal" | "audit" | "forensic_redacted";
        allowed_archive_modes: ("minimal" | "audit" | "forensic_redacted")[];
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
    }, {
        enabled?: boolean | undefined;
        legal_hold?: {
            enabled?: boolean | undefined;
            require_reason?: boolean | undefined;
        } | undefined;
        archive_dir?: string | undefined;
        lifecycle_dir?: string | undefined;
        retention_ledger_dir?: string | undefined;
        default_archive_mode?: "minimal" | "audit" | "forensic_redacted" | undefined;
        allowed_archive_modes?: ("minimal" | "audit" | "forensic_redacted")[] | undefined;
        require_ledger_pass_for_archive?: boolean | undefined;
        require_org_retention_plan_for_archive?: boolean | undefined;
        require_signed_archive_manifest?: boolean | undefined;
        allow_archive_without_release_packet?: boolean | undefined;
        allow_archive_without_evidence_bundle?: boolean | undefined;
        allow_compact_summary_bundle?: boolean | undefined;
        delete_originals_after_archive?: false | undefined;
        purge_enabled?: false | undefined;
        max_archive_bytes?: number | undefined;
        redaction?: {
            exclude_private_keys?: boolean | undefined;
            exclude_env_files?: boolean | undefined;
            exclude_raw_provider_outputs?: boolean | undefined;
            exclude_unbounded_command_logs?: boolean | undefined;
            redact_secret_like_values?: boolean | undefined;
        } | undefined;
    }>>;
    evidence_disposal: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        disposal_dir: z.ZodDefault<z.ZodString>;
        require_retention_expired: z.ZodDefault<z.ZodBoolean>;
        require_no_legal_hold: z.ZodDefault<z.ZodBoolean>;
        require_archive_verified: z.ZodDefault<z.ZodBoolean>;
        require_retention_ledger: z.ZodDefault<z.ZodBoolean>;
        require_org_approval: z.ZodDefault<z.ZodBoolean>;
        require_disposal_attestation: z.ZodDefault<z.ZodBoolean>;
        delete_scope: z.ZodDefault<z.ZodLiteral<"run-evidence-only">>;
        allow_archive_deletion: z.ZodDefault<z.ZodLiteral<false>>;
        allow_key_deletion: z.ZodDefault<z.ZodLiteral<false>>;
        allow_source_deletion: z.ZodDefault<z.ZodLiteral<false>>;
        allow_remote_deletion: z.ZodDefault<z.ZodLiteral<false>>;
        allow_automatic_purge: z.ZodDefault<z.ZodLiteral<false>>;
        dry_run_by_default: z.ZodDefault<z.ZodLiteral<true>>;
        max_files_per_disposal: z.ZodDefault<z.ZodNumber>;
        max_bytes_per_disposal: z.ZodDefault<z.ZodNumber>;
        protected_classes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        receipt: z.ZodDefault<z.ZodObject<{
            require_sha256_before_delete: z.ZodDefault<z.ZodBoolean>;
            require_post_delete_verification: z.ZodDefault<z.ZodBoolean>;
            include_recovery_guidance: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            require_sha256_before_delete: boolean;
            require_post_delete_verification: boolean;
            include_recovery_guidance: boolean;
        }, {
            require_sha256_before_delete?: boolean | undefined;
            require_post_delete_verification?: boolean | undefined;
            include_recovery_guidance?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        disposal_dir: string;
        require_retention_expired: boolean;
        require_no_legal_hold: boolean;
        require_archive_verified: boolean;
        require_retention_ledger: boolean;
        require_org_approval: boolean;
        require_disposal_attestation: boolean;
        delete_scope: "run-evidence-only";
        allow_archive_deletion: false;
        allow_key_deletion: false;
        allow_source_deletion: false;
        allow_remote_deletion: false;
        allow_automatic_purge: false;
        dry_run_by_default: true;
        max_files_per_disposal: number;
        max_bytes_per_disposal: number;
        protected_classes: string[];
        receipt: {
            require_sha256_before_delete: boolean;
            require_post_delete_verification: boolean;
            include_recovery_guidance: boolean;
        };
    }, {
        enabled?: boolean | undefined;
        disposal_dir?: string | undefined;
        require_retention_expired?: boolean | undefined;
        require_no_legal_hold?: boolean | undefined;
        require_archive_verified?: boolean | undefined;
        require_retention_ledger?: boolean | undefined;
        require_org_approval?: boolean | undefined;
        require_disposal_attestation?: boolean | undefined;
        delete_scope?: "run-evidence-only" | undefined;
        allow_archive_deletion?: false | undefined;
        allow_key_deletion?: false | undefined;
        allow_source_deletion?: false | undefined;
        allow_remote_deletion?: false | undefined;
        allow_automatic_purge?: false | undefined;
        dry_run_by_default?: true | undefined;
        max_files_per_disposal?: number | undefined;
        max_bytes_per_disposal?: number | undefined;
        protected_classes?: string[] | undefined;
        receipt?: {
            require_sha256_before_delete?: boolean | undefined;
            require_post_delete_verification?: boolean | undefined;
            include_recovery_guidance?: boolean | undefined;
        } | undefined;
    }>>;
    dogfood: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        workspace_dir: z.ZodDefault<z.ZodString>;
        fixtures_dir: z.ZodDefault<z.ZodString>;
        reports_dir: z.ZodDefault<z.ZodString>;
        default_matrix: z.ZodDefault<z.ZodArray<z.ZodEnum<["node-package", "vite-react", "express-api", "nextjs-app", "python-package", "rust-crate", "solana-anchor-structural"]>, "many">>;
        allow_live_provider_smoke: z.ZodDefault<z.ZodBoolean>;
        require_live_confirmation: z.ZodDefault<z.ZodBoolean>;
        allow_fixture_patch_apply: z.ZodDefault<z.ZodBoolean>;
        allow_real_repo_patch_apply: z.ZodDefault<z.ZodBoolean>;
        max_fixture_runtime_ms: z.ZodDefault<z.ZodNumber>;
        max_total_runtime_ms: z.ZodDefault<z.ZodNumber>;
        max_report_bytes: z.ZodDefault<z.ZodNumber>;
        external_scanners: z.ZodDefault<z.ZodObject<{
            detect_only_by_default: z.ZodDefault<z.ZodBoolean>;
            allow_execution: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            detect_only_by_default: boolean;
            allow_execution: boolean;
        }, {
            detect_only_by_default?: boolean | undefined;
            allow_execution?: boolean | undefined;
        }>>;
        package_check: z.ZodDefault<z.ZodObject<{
            run_npm_pack: z.ZodDefault<z.ZodBoolean>;
            install_packed_cli_in_temp: z.ZodDefault<z.ZodBoolean>;
            run_packed_cli_smoke: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            run_npm_pack: boolean;
            install_packed_cli_in_temp: boolean;
            run_packed_cli_smoke: boolean;
        }, {
            run_npm_pack?: boolean | undefined;
            install_packed_cli_in_temp?: boolean | undefined;
            run_packed_cli_smoke?: boolean | undefined;
        }>>;
        safety: z.ZodDefault<z.ZodObject<{
            run_red_team_harness: z.ZodDefault<z.ZodBoolean>;
            block_network_by_default: z.ZodDefault<z.ZodBoolean>;
            redact_outputs: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            run_red_team_harness: boolean;
            block_network_by_default: boolean;
            redact_outputs: boolean;
        }, {
            run_red_team_harness?: boolean | undefined;
            block_network_by_default?: boolean | undefined;
            redact_outputs?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        workspace_dir: string;
        fixtures_dir: string;
        reports_dir: string;
        default_matrix: ("node-package" | "vite-react" | "express-api" | "nextjs-app" | "python-package" | "rust-crate" | "solana-anchor-structural")[];
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
    }, {
        enabled?: boolean | undefined;
        workspace_dir?: string | undefined;
        fixtures_dir?: string | undefined;
        reports_dir?: string | undefined;
        default_matrix?: ("node-package" | "vite-react" | "express-api" | "nextjs-app" | "python-package" | "rust-crate" | "solana-anchor-structural")[] | undefined;
        allow_live_provider_smoke?: boolean | undefined;
        require_live_confirmation?: boolean | undefined;
        allow_fixture_patch_apply?: boolean | undefined;
        allow_real_repo_patch_apply?: boolean | undefined;
        max_fixture_runtime_ms?: number | undefined;
        max_total_runtime_ms?: number | undefined;
        max_report_bytes?: number | undefined;
        external_scanners?: {
            detect_only_by_default?: boolean | undefined;
            allow_execution?: boolean | undefined;
        } | undefined;
        package_check?: {
            run_npm_pack?: boolean | undefined;
            install_packed_cli_in_temp?: boolean | undefined;
            run_packed_cli_smoke?: boolean | undefined;
        } | undefined;
        safety?: {
            run_red_team_harness?: boolean | undefined;
            block_network_by_default?: boolean | undefined;
            redact_outputs?: boolean | undefined;
        } | undefined;
    }>>;
    beta: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        reports_dir: z.ZodDefault<z.ZodString>;
        trials_dir: z.ZodDefault<z.ZodString>;
        feedback_dir: z.ZodDefault<z.ZodString>;
        rc_dir: z.ZodDefault<z.ZodString>;
        default_channel: z.ZodDefault<z.ZodEnum<["private-beta", "closed-beta", "public-beta"]>>;
        allowed_channels: z.ZodDefault<z.ZodArray<z.ZodEnum<["private-beta", "closed-beta", "public-beta"]>, "many">>;
        gates: z.ZodDefault<z.ZodObject<{
            require_lint_pass: z.ZodDefault<z.ZodBoolean>;
            require_test_pass: z.ZodDefault<z.ZodBoolean>;
            require_build_pass: z.ZodDefault<z.ZodBoolean>;
            require_dogfood_pass: z.ZodDefault<z.ZodBoolean>;
            require_security_redteam_pass: z.ZodDefault<z.ZodBoolean>;
            require_package_check_pass: z.ZodDefault<z.ZodBoolean>;
            require_docs_check_pass: z.ZodDefault<z.ZodBoolean>;
            require_perf_check_pass: z.ZodDefault<z.ZodBoolean>;
            require_beta_backlog_no_blockers: z.ZodDefault<z.ZodBoolean>;
            require_dogfood_patch_apply_smoke: z.ZodDefault<z.ZodBoolean>;
            require_live_provider_smoke: z.ZodDefault<z.ZodBoolean>;
            require_external_scanners_installed: z.ZodDefault<z.ZodBoolean>;
            allow_accepted_warnings: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
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
        }, {
            require_lint_pass?: boolean | undefined;
            require_test_pass?: boolean | undefined;
            require_build_pass?: boolean | undefined;
            require_dogfood_pass?: boolean | undefined;
            require_security_redteam_pass?: boolean | undefined;
            require_package_check_pass?: boolean | undefined;
            require_docs_check_pass?: boolean | undefined;
            require_perf_check_pass?: boolean | undefined;
            require_beta_backlog_no_blockers?: boolean | undefined;
            require_dogfood_patch_apply_smoke?: boolean | undefined;
            require_live_provider_smoke?: boolean | undefined;
            require_external_scanners_installed?: boolean | undefined;
            allow_accepted_warnings?: boolean | undefined;
        }>>;
        warnings: z.ZodDefault<z.ZodObject<{
            max_accepted_warnings: z.ZodDefault<z.ZodNumber>;
            require_acceptance_reason: z.ZodDefault<z.ZodBoolean>;
            require_reviewer_for_acceptance: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            max_accepted_warnings: number;
            require_acceptance_reason: boolean;
            require_reviewer_for_acceptance: boolean;
        }, {
            max_accepted_warnings?: number | undefined;
            require_acceptance_reason?: boolean | undefined;
            require_reviewer_for_acceptance?: boolean | undefined;
        }>>;
        package: z.ZodDefault<z.ZodObject<{
            require_npm_pack: z.ZodDefault<z.ZodBoolean>;
            require_temp_install: z.ZodDefault<z.ZodBoolean>;
            require_compiled_cli_smoke: z.ZodDefault<z.ZodBoolean>;
            require_no_private_artifacts_in_package: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            require_npm_pack: boolean;
            require_temp_install: boolean;
            require_compiled_cli_smoke: boolean;
            require_no_private_artifacts_in_package: boolean;
        }, {
            require_npm_pack?: boolean | undefined;
            require_temp_install?: boolean | undefined;
            require_compiled_cli_smoke?: boolean | undefined;
            require_no_private_artifacts_in_package?: boolean | undefined;
        }>>;
        docs: z.ZodDefault<z.ZodObject<{
            strict_command_coverage: z.ZodDefault<z.ZodBoolean>;
            strict_confirmation_docs: z.ZodDefault<z.ZodBoolean>;
            forbid_unsupported_capability_claims: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            strict_command_coverage: boolean;
            strict_confirmation_docs: boolean;
            forbid_unsupported_capability_claims: boolean;
        }, {
            strict_command_coverage?: boolean | undefined;
            strict_confirmation_docs?: boolean | undefined;
            forbid_unsupported_capability_claims?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        docs: {
            strict_command_coverage: boolean;
            strict_confirmation_docs: boolean;
            forbid_unsupported_capability_claims: boolean;
        };
        package: {
            require_npm_pack: boolean;
            require_temp_install: boolean;
            require_compiled_cli_smoke: boolean;
            require_no_private_artifacts_in_package: boolean;
        };
        enabled: boolean;
        reports_dir: string;
        trials_dir: string;
        feedback_dir: string;
        rc_dir: string;
        default_channel: "private-beta" | "closed-beta" | "public-beta";
        allowed_channels: ("private-beta" | "closed-beta" | "public-beta")[];
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
    }, {
        docs?: {
            strict_command_coverage?: boolean | undefined;
            strict_confirmation_docs?: boolean | undefined;
            forbid_unsupported_capability_claims?: boolean | undefined;
        } | undefined;
        package?: {
            require_npm_pack?: boolean | undefined;
            require_temp_install?: boolean | undefined;
            require_compiled_cli_smoke?: boolean | undefined;
            require_no_private_artifacts_in_package?: boolean | undefined;
        } | undefined;
        enabled?: boolean | undefined;
        reports_dir?: string | undefined;
        trials_dir?: string | undefined;
        feedback_dir?: string | undefined;
        rc_dir?: string | undefined;
        default_channel?: "private-beta" | "closed-beta" | "public-beta" | undefined;
        allowed_channels?: ("private-beta" | "closed-beta" | "public-beta")[] | undefined;
        gates?: {
            require_lint_pass?: boolean | undefined;
            require_test_pass?: boolean | undefined;
            require_build_pass?: boolean | undefined;
            require_dogfood_pass?: boolean | undefined;
            require_security_redteam_pass?: boolean | undefined;
            require_package_check_pass?: boolean | undefined;
            require_docs_check_pass?: boolean | undefined;
            require_perf_check_pass?: boolean | undefined;
            require_beta_backlog_no_blockers?: boolean | undefined;
            require_dogfood_patch_apply_smoke?: boolean | undefined;
            require_live_provider_smoke?: boolean | undefined;
            require_external_scanners_installed?: boolean | undefined;
            allow_accepted_warnings?: boolean | undefined;
        } | undefined;
        warnings?: {
            max_accepted_warnings?: number | undefined;
            require_acceptance_reason?: boolean | undefined;
            require_reviewer_for_acceptance?: boolean | undefined;
        } | undefined;
    }>>;
    organization: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        org_id: z.ZodDefault<z.ZodString>;
        org_name: z.ZodDefault<z.ZodString>;
        policy_bundle_dir: z.ZodDefault<z.ZodString>;
        key_dir: z.ZodDefault<z.ZodString>;
        audit_log_dir: z.ZodDefault<z.ZodString>;
        require_signed_policy_bundle: z.ZodDefault<z.ZodBoolean>;
        require_multi_reviewer_approval_for_release: z.ZodDefault<z.ZodBoolean>;
        require_remote_receipt_refresh_for_release: z.ZodDefault<z.ZodBoolean>;
        require_retention_plan_for_release: z.ZodDefault<z.ZodBoolean>;
        default_approval_policy: z.ZodDefault<z.ZodString>;
        reviewers: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            display_name: z.ZodString;
            roles: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            display_name: string;
            roles: string[];
        }, {
            id: string;
            display_name: string;
            roles?: string[] | undefined;
        }>, "many">>;
        approval_policies: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodObject<{
            min_approvals: z.ZodNumber;
            required_roles: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            disallow_self_approval: z.ZodDefault<z.ZodBoolean>;
            require_distinct_reviewers: z.ZodDefault<z.ZodBoolean>;
            allow_needs_changes: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            min_approvals: number;
            required_roles: string[];
            disallow_self_approval: boolean;
            require_distinct_reviewers: boolean;
            allow_needs_changes: boolean;
        }, {
            min_approvals: number;
            required_roles?: string[] | undefined;
            disallow_self_approval?: boolean | undefined;
            require_distinct_reviewers?: boolean | undefined;
            allow_needs_changes?: boolean | undefined;
        }>>>;
        retention: z.ZodDefault<z.ZodObject<{
            default_policy: z.ZodDefault<z.ZodString>;
            policies: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodObject<{
                retention_days: z.ZodNullable<z.ZodNumber>;
                legal_hold: z.ZodDefault<z.ZodBoolean>;
                export_mode: z.ZodDefault<z.ZodEnum<["minimal", "audit", "forensic_redacted"]>>;
            }, "strip", z.ZodTypeAny, {
                legal_hold: boolean;
                retention_days: number | null;
                export_mode: "minimal" | "audit" | "forensic_redacted";
            }, {
                retention_days: number | null;
                legal_hold?: boolean | undefined;
                export_mode?: "minimal" | "audit" | "forensic_redacted" | undefined;
            }>>>;
        }, "strip", z.ZodTypeAny, {
            default_policy: string;
            policies: Record<string, {
                legal_hold: boolean;
                retention_days: number | null;
                export_mode: "minimal" | "audit" | "forensic_redacted";
            }>;
        }, {
            default_policy?: string | undefined;
            policies?: Record<string, {
                retention_days: number | null;
                legal_hold?: boolean | undefined;
                export_mode?: "minimal" | "audit" | "forensic_redacted" | undefined;
            }> | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        retention: {
            default_policy: string;
            policies: Record<string, {
                legal_hold: boolean;
                retention_days: number | null;
                export_mode: "minimal" | "audit" | "forensic_redacted";
            }>;
        };
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
        reviewers: {
            id: string;
            display_name: string;
            roles: string[];
        }[];
        approval_policies: Record<string, {
            min_approvals: number;
            required_roles: string[];
            disallow_self_approval: boolean;
            require_distinct_reviewers: boolean;
            allow_needs_changes: boolean;
        }>;
    }, {
        enabled?: boolean | undefined;
        retention?: {
            default_policy?: string | undefined;
            policies?: Record<string, {
                retention_days: number | null;
                legal_hold?: boolean | undefined;
                export_mode?: "minimal" | "audit" | "forensic_redacted" | undefined;
            }> | undefined;
        } | undefined;
        org_id?: string | undefined;
        org_name?: string | undefined;
        policy_bundle_dir?: string | undefined;
        key_dir?: string | undefined;
        audit_log_dir?: string | undefined;
        require_signed_policy_bundle?: boolean | undefined;
        require_multi_reviewer_approval_for_release?: boolean | undefined;
        require_remote_receipt_refresh_for_release?: boolean | undefined;
        require_retention_plan_for_release?: boolean | undefined;
        default_approval_policy?: string | undefined;
        reviewers?: {
            id: string;
            display_name: string;
            roles?: string[] | undefined;
        }[] | undefined;
        approval_policies?: Record<string, {
            min_approvals: number;
            required_roles?: string[] | undefined;
            disallow_self_approval?: boolean | undefined;
            require_distinct_reviewers?: boolean | undefined;
            allow_needs_changes?: boolean | undefined;
        }> | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    dogfood: {
        enabled: boolean;
        workspace_dir: string;
        fixtures_dir: string;
        reports_dir: string;
        default_matrix: ("node-package" | "vite-react" | "express-api" | "nextjs-app" | "python-package" | "rust-crate" | "solana-anchor-structural")[];
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
    audit: {
        enabled: boolean;
        schema_dir: string;
        export_dir: string;
        reviewer_directory_dir: string;
        default_schema: string;
        allow_custom_schemas: boolean;
        require_signed_audit_exports: boolean;
        include_raw_logs_by_default: boolean;
        max_export_bytes: number;
        allowed_export_formats: ("json" | "markdown" | "csv")[];
        compliance_language: {
            avoid_certification_claims: boolean;
            use_control_mapping_terms: boolean;
        };
        retention: {
            audit_export_retention_days: number;
            legal_hold: boolean;
        };
    };
    version: 1;
    default_profile: string;
    providers: Record<string, {
        type: "openrouter";
        api_key_env: string;
        base_url: string;
    } | {
        type: "openai-compatible";
        api_key_env: string;
        base_url: string;
    } | {
        type: "external-opencode";
        username_env?: string | undefined;
        password_env?: string | undefined;
    }>;
    profiles: Record<string, {
        agents: Record<string, {
            provider: string;
            can_write_files: boolean;
            can_run_commands: boolean;
            model?: string | undefined;
            model_alias?: string | undefined;
            fallback_models?: {
                provider?: string | undefined;
                model?: string | undefined;
                model_alias?: string | undefined;
            }[] | undefined;
        }>;
        routing_strategy?: string | undefined;
    }>;
    routing: {
        default_strategy: string;
        strategies: Record<string, {
            prefer: string[];
            allow_fallback: boolean;
            max_model_cost_tier?: "unknown" | "low" | "medium" | "high" | "free" | undefined;
        }>;
    };
    model_aliases: Record<string, {
        provider: string;
        model: string;
    }>;
    budget: {
        max_run_cost_usd: number;
        stop_on_budget_risk: boolean;
        max_repair_cycles_per_gate: number;
        max_parallel_agents: number;
        max_agent_cost_usd?: number | undefined;
        max_repair_cost_usd?: number | undefined;
        max_live_agents_per_run?: number | undefined;
        max_stream_tokens_per_agent?: number | undefined;
        max_total_tokens_per_run?: number | undefined;
    };
    provider_runtime: {
        request_timeout_ms: number;
    };
    command_runtime: {
        command_timeout_ms: number;
    };
    release: {
        default_channel: string;
        allowed_channels: string[];
        versioning: {
            strategy: "semver";
            allow_prerelease: boolean;
            prerelease_identifiers: string[];
        };
        changelog: {
            file: string;
            style: "keepachangelog";
            include_vibecli_footer: boolean;
        };
        release_branch: {
            prefix: string;
            protected_target_branches: string[];
        };
        tags: {
            prefix: string;
            annotated: boolean;
            allow_tag_on_dirty_worktree: boolean;
        };
        ci: {
            providers: string[];
            require_ci_pass_for_production: boolean;
        };
        deployment: {
            require_deployment_readiness_for_production: boolean;
            execute_deploy_commands: false;
        };
    };
    git_lifecycle: {
        branch_prefix: string;
        commit_style: "conventional" | "plain";
        protected_branches: string[];
        allow_commit_on_protected_branch: boolean;
        require_applied_before_commit: boolean;
        require_verification_before_commit: boolean;
        require_ledger_pass_before_commit: boolean;
        require_scanner_no_high_or_critical_before_commit: boolean;
        stage_only_applied_files: boolean;
        include_handoff_artifacts_by_default: boolean;
        allow_dirty_worktree_for_branch_create: boolean;
        allow_dirty_worktree_for_commit: boolean;
    };
    beta: {
        docs: {
            strict_command_coverage: boolean;
            strict_confirmation_docs: boolean;
            forbid_unsupported_capability_claims: boolean;
        };
        package: {
            require_npm_pack: boolean;
            require_temp_install: boolean;
            require_compiled_cli_smoke: boolean;
            require_no_private_artifacts_in_package: boolean;
        };
        enabled: boolean;
        reports_dir: string;
        trials_dir: string;
        feedback_dir: string;
        rc_dir: string;
        default_channel: "private-beta" | "closed-beta" | "public-beta";
        allowed_channels: ("private-beta" | "closed-beta" | "public-beta")[];
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
    };
    provenance: {
        enabled: boolean;
        format: "slsa-inspired";
        signing: {
            enabled: boolean;
            key_dir: string;
            algorithm: "ed25519";
            private_key_file: string;
            public_key_file: string;
            require_local_key_for_signing: boolean;
        };
        evidence: {
            include_release_packet: boolean;
            include_handoff_summary: boolean;
            include_ledger_manifest: boolean;
            include_verification_results: boolean;
            include_scanner_results: boolean;
            include_ci_status: boolean;
            include_deployment_readiness: boolean;
            include_git_lifecycle: boolean;
        };
        github_release: {
            allow_draft_creation: boolean;
            publish_releases: false;
            upload_assets: false;
            require_existing_remote_tag: boolean;
            require_release_readiness_for_draft: boolean;
            require_release_readiness_for_production_draft: boolean;
        };
    };
    remote_attestation: {
        enabled: boolean;
        request_timeout_ms: number;
        allow_remote_submission: boolean;
        require_exact_confirmation: boolean;
        require_signed_provenance: boolean;
        require_evidence_bundle: boolean;
        require_ledger_pass: boolean;
        require_release_packet: boolean;
        require_https_targets: boolean;
        allow_localhost_targets: boolean;
        max_payload_bytes: number;
        send_metadata_only: boolean;
        include_evidence_archive_by_default: boolean;
        targets: Record<string, {
            type: "generic-http";
            url: string;
            enabled: boolean;
            headers: Record<string, string>;
            token_env?: string | undefined;
        }>;
    };
    evidence_lifecycle: {
        enabled: boolean;
        legal_hold: {
            enabled: boolean;
            require_reason: boolean;
        };
        archive_dir: string;
        lifecycle_dir: string;
        retention_ledger_dir: string;
        default_archive_mode: "minimal" | "audit" | "forensic_redacted";
        allowed_archive_modes: ("minimal" | "audit" | "forensic_redacted")[];
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
    };
    evidence_disposal: {
        enabled: boolean;
        disposal_dir: string;
        require_retention_expired: boolean;
        require_no_legal_hold: boolean;
        require_archive_verified: boolean;
        require_retention_ledger: boolean;
        require_org_approval: boolean;
        require_disposal_attestation: boolean;
        delete_scope: "run-evidence-only";
        allow_archive_deletion: false;
        allow_key_deletion: false;
        allow_source_deletion: false;
        allow_remote_deletion: false;
        allow_automatic_purge: false;
        dry_run_by_default: true;
        max_files_per_disposal: number;
        max_bytes_per_disposal: number;
        protected_classes: string[];
        receipt: {
            require_sha256_before_delete: boolean;
            require_post_delete_verification: boolean;
            include_recovery_guidance: boolean;
        };
    };
    organization: {
        enabled: boolean;
        retention: {
            default_policy: string;
            policies: Record<string, {
                legal_hold: boolean;
                retention_days: number | null;
                export_mode: "minimal" | "audit" | "forensic_redacted";
            }>;
        };
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
        reviewers: {
            id: string;
            display_name: string;
            roles: string[];
        }[];
        approval_policies: Record<string, {
            min_approvals: number;
            required_roles: string[];
            disallow_self_approval: boolean;
            require_distinct_reviewers: boolean;
            allow_needs_changes: boolean;
        }>;
    };
}, {
    version: 1;
    default_profile: string;
    providers: Record<string, {
        type: "openrouter";
        api_key_env: string;
        base_url?: string | undefined;
    } | {
        type: "openai-compatible";
        api_key_env: string;
        base_url: string;
    } | {
        type: "external-opencode";
        username_env?: string | undefined;
        password_env?: string | undefined;
    }>;
    profiles: Record<string, {
        agents: Record<string, {
            provider: string;
            can_write_files: boolean;
            can_run_commands: boolean;
            model?: string | undefined;
            model_alias?: string | undefined;
            fallback_models?: {
                provider?: string | undefined;
                model?: string | undefined;
                model_alias?: string | undefined;
            }[] | undefined;
        }>;
        routing_strategy?: string | undefined;
    }>;
    budget: {
        max_run_cost_usd: number;
        max_repair_cycles_per_gate: number;
        max_parallel_agents: number;
        max_agent_cost_usd?: number | undefined;
        max_repair_cost_usd?: number | undefined;
        max_live_agents_per_run?: number | undefined;
        max_stream_tokens_per_agent?: number | undefined;
        max_total_tokens_per_run?: number | undefined;
        stop_on_budget_risk?: boolean | undefined;
    };
    dogfood?: {
        enabled?: boolean | undefined;
        workspace_dir?: string | undefined;
        fixtures_dir?: string | undefined;
        reports_dir?: string | undefined;
        default_matrix?: ("node-package" | "vite-react" | "express-api" | "nextjs-app" | "python-package" | "rust-crate" | "solana-anchor-structural")[] | undefined;
        allow_live_provider_smoke?: boolean | undefined;
        require_live_confirmation?: boolean | undefined;
        allow_fixture_patch_apply?: boolean | undefined;
        allow_real_repo_patch_apply?: boolean | undefined;
        max_fixture_runtime_ms?: number | undefined;
        max_total_runtime_ms?: number | undefined;
        max_report_bytes?: number | undefined;
        external_scanners?: {
            detect_only_by_default?: boolean | undefined;
            allow_execution?: boolean | undefined;
        } | undefined;
        package_check?: {
            run_npm_pack?: boolean | undefined;
            install_packed_cli_in_temp?: boolean | undefined;
            run_packed_cli_smoke?: boolean | undefined;
        } | undefined;
        safety?: {
            run_red_team_harness?: boolean | undefined;
            block_network_by_default?: boolean | undefined;
            redact_outputs?: boolean | undefined;
        } | undefined;
    } | undefined;
    audit?: {
        enabled?: boolean | undefined;
        schema_dir?: string | undefined;
        export_dir?: string | undefined;
        reviewer_directory_dir?: string | undefined;
        default_schema?: string | undefined;
        allow_custom_schemas?: boolean | undefined;
        require_signed_audit_exports?: boolean | undefined;
        include_raw_logs_by_default?: boolean | undefined;
        max_export_bytes?: number | undefined;
        allowed_export_formats?: ("json" | "markdown" | "csv")[] | undefined;
        compliance_language?: {
            avoid_certification_claims?: boolean | undefined;
            use_control_mapping_terms?: boolean | undefined;
        } | undefined;
        retention?: {
            audit_export_retention_days?: number | undefined;
            legal_hold?: boolean | undefined;
        } | undefined;
    } | undefined;
    routing?: {
        strategies: Record<string, {
            prefer?: string[] | undefined;
            max_model_cost_tier?: "unknown" | "low" | "medium" | "high" | "free" | undefined;
            allow_fallback?: boolean | undefined;
        }>;
        default_strategy?: string | undefined;
    } | undefined;
    model_aliases?: Record<string, {
        provider: string;
        model: string;
    }> | undefined;
    provider_runtime?: {
        request_timeout_ms?: number | undefined;
    } | undefined;
    command_runtime?: {
        command_timeout_ms?: number | undefined;
    } | undefined;
    release?: {
        default_channel?: string | undefined;
        allowed_channels?: string[] | undefined;
        versioning?: {
            strategy?: "semver" | undefined;
            allow_prerelease?: boolean | undefined;
            prerelease_identifiers?: string[] | undefined;
        } | undefined;
        changelog?: {
            file?: string | undefined;
            style?: "keepachangelog" | undefined;
            include_vibecli_footer?: boolean | undefined;
        } | undefined;
        release_branch?: {
            prefix?: string | undefined;
            protected_target_branches?: string[] | undefined;
        } | undefined;
        tags?: {
            prefix?: string | undefined;
            annotated?: boolean | undefined;
            allow_tag_on_dirty_worktree?: boolean | undefined;
        } | undefined;
        ci?: {
            providers?: string[] | undefined;
            require_ci_pass_for_production?: boolean | undefined;
        } | undefined;
        deployment?: {
            require_deployment_readiness_for_production?: boolean | undefined;
            execute_deploy_commands?: false | undefined;
        } | undefined;
    } | undefined;
    git_lifecycle?: {
        branch_prefix?: string | undefined;
        commit_style?: "conventional" | "plain" | undefined;
        protected_branches?: string[] | undefined;
        allow_commit_on_protected_branch?: boolean | undefined;
        require_applied_before_commit?: boolean | undefined;
        require_verification_before_commit?: boolean | undefined;
        require_ledger_pass_before_commit?: boolean | undefined;
        require_scanner_no_high_or_critical_before_commit?: boolean | undefined;
        stage_only_applied_files?: boolean | undefined;
        include_handoff_artifacts_by_default?: boolean | undefined;
        allow_dirty_worktree_for_branch_create?: boolean | undefined;
        allow_dirty_worktree_for_commit?: boolean | undefined;
    } | undefined;
    beta?: {
        docs?: {
            strict_command_coverage?: boolean | undefined;
            strict_confirmation_docs?: boolean | undefined;
            forbid_unsupported_capability_claims?: boolean | undefined;
        } | undefined;
        package?: {
            require_npm_pack?: boolean | undefined;
            require_temp_install?: boolean | undefined;
            require_compiled_cli_smoke?: boolean | undefined;
            require_no_private_artifacts_in_package?: boolean | undefined;
        } | undefined;
        enabled?: boolean | undefined;
        reports_dir?: string | undefined;
        trials_dir?: string | undefined;
        feedback_dir?: string | undefined;
        rc_dir?: string | undefined;
        default_channel?: "private-beta" | "closed-beta" | "public-beta" | undefined;
        allowed_channels?: ("private-beta" | "closed-beta" | "public-beta")[] | undefined;
        gates?: {
            require_lint_pass?: boolean | undefined;
            require_test_pass?: boolean | undefined;
            require_build_pass?: boolean | undefined;
            require_dogfood_pass?: boolean | undefined;
            require_security_redteam_pass?: boolean | undefined;
            require_package_check_pass?: boolean | undefined;
            require_docs_check_pass?: boolean | undefined;
            require_perf_check_pass?: boolean | undefined;
            require_beta_backlog_no_blockers?: boolean | undefined;
            require_dogfood_patch_apply_smoke?: boolean | undefined;
            require_live_provider_smoke?: boolean | undefined;
            require_external_scanners_installed?: boolean | undefined;
            allow_accepted_warnings?: boolean | undefined;
        } | undefined;
        warnings?: {
            max_accepted_warnings?: number | undefined;
            require_acceptance_reason?: boolean | undefined;
            require_reviewer_for_acceptance?: boolean | undefined;
        } | undefined;
    } | undefined;
    provenance?: {
        enabled?: boolean | undefined;
        format?: "slsa-inspired" | undefined;
        signing?: {
            enabled?: boolean | undefined;
            key_dir?: string | undefined;
            algorithm?: "ed25519" | undefined;
            private_key_file?: string | undefined;
            public_key_file?: string | undefined;
            require_local_key_for_signing?: boolean | undefined;
        } | undefined;
        evidence?: {
            include_release_packet?: boolean | undefined;
            include_handoff_summary?: boolean | undefined;
            include_ledger_manifest?: boolean | undefined;
            include_verification_results?: boolean | undefined;
            include_scanner_results?: boolean | undefined;
            include_ci_status?: boolean | undefined;
            include_deployment_readiness?: boolean | undefined;
            include_git_lifecycle?: boolean | undefined;
        } | undefined;
        github_release?: {
            allow_draft_creation?: boolean | undefined;
            publish_releases?: false | undefined;
            upload_assets?: false | undefined;
            require_existing_remote_tag?: boolean | undefined;
            require_release_readiness_for_draft?: boolean | undefined;
            require_release_readiness_for_production_draft?: boolean | undefined;
        } | undefined;
    } | undefined;
    remote_attestation?: {
        enabled?: boolean | undefined;
        request_timeout_ms?: number | undefined;
        allow_remote_submission?: boolean | undefined;
        require_exact_confirmation?: boolean | undefined;
        require_signed_provenance?: boolean | undefined;
        require_evidence_bundle?: boolean | undefined;
        require_ledger_pass?: boolean | undefined;
        require_release_packet?: boolean | undefined;
        require_https_targets?: boolean | undefined;
        allow_localhost_targets?: boolean | undefined;
        max_payload_bytes?: number | undefined;
        send_metadata_only?: boolean | undefined;
        include_evidence_archive_by_default?: boolean | undefined;
        targets?: Record<string, {
            type: "generic-http";
            url: string;
            token_env?: string | undefined;
            enabled?: boolean | undefined;
            headers?: Record<string, string> | undefined;
        }> | undefined;
    } | undefined;
    evidence_lifecycle?: {
        enabled?: boolean | undefined;
        legal_hold?: {
            enabled?: boolean | undefined;
            require_reason?: boolean | undefined;
        } | undefined;
        archive_dir?: string | undefined;
        lifecycle_dir?: string | undefined;
        retention_ledger_dir?: string | undefined;
        default_archive_mode?: "minimal" | "audit" | "forensic_redacted" | undefined;
        allowed_archive_modes?: ("minimal" | "audit" | "forensic_redacted")[] | undefined;
        require_ledger_pass_for_archive?: boolean | undefined;
        require_org_retention_plan_for_archive?: boolean | undefined;
        require_signed_archive_manifest?: boolean | undefined;
        allow_archive_without_release_packet?: boolean | undefined;
        allow_archive_without_evidence_bundle?: boolean | undefined;
        allow_compact_summary_bundle?: boolean | undefined;
        delete_originals_after_archive?: false | undefined;
        purge_enabled?: false | undefined;
        max_archive_bytes?: number | undefined;
        redaction?: {
            exclude_private_keys?: boolean | undefined;
            exclude_env_files?: boolean | undefined;
            exclude_raw_provider_outputs?: boolean | undefined;
            exclude_unbounded_command_logs?: boolean | undefined;
            redact_secret_like_values?: boolean | undefined;
        } | undefined;
    } | undefined;
    evidence_disposal?: {
        enabled?: boolean | undefined;
        disposal_dir?: string | undefined;
        require_retention_expired?: boolean | undefined;
        require_no_legal_hold?: boolean | undefined;
        require_archive_verified?: boolean | undefined;
        require_retention_ledger?: boolean | undefined;
        require_org_approval?: boolean | undefined;
        require_disposal_attestation?: boolean | undefined;
        delete_scope?: "run-evidence-only" | undefined;
        allow_archive_deletion?: false | undefined;
        allow_key_deletion?: false | undefined;
        allow_source_deletion?: false | undefined;
        allow_remote_deletion?: false | undefined;
        allow_automatic_purge?: false | undefined;
        dry_run_by_default?: true | undefined;
        max_files_per_disposal?: number | undefined;
        max_bytes_per_disposal?: number | undefined;
        protected_classes?: string[] | undefined;
        receipt?: {
            require_sha256_before_delete?: boolean | undefined;
            require_post_delete_verification?: boolean | undefined;
            include_recovery_guidance?: boolean | undefined;
        } | undefined;
    } | undefined;
    organization?: {
        enabled?: boolean | undefined;
        retention?: {
            default_policy?: string | undefined;
            policies?: Record<string, {
                retention_days: number | null;
                legal_hold?: boolean | undefined;
                export_mode?: "minimal" | "audit" | "forensic_redacted" | undefined;
            }> | undefined;
        } | undefined;
        org_id?: string | undefined;
        org_name?: string | undefined;
        policy_bundle_dir?: string | undefined;
        key_dir?: string | undefined;
        audit_log_dir?: string | undefined;
        require_signed_policy_bundle?: boolean | undefined;
        require_multi_reviewer_approval_for_release?: boolean | undefined;
        require_remote_receipt_refresh_for_release?: boolean | undefined;
        require_retention_plan_for_release?: boolean | undefined;
        default_approval_policy?: string | undefined;
        reviewers?: {
            id: string;
            display_name: string;
            roles?: string[] | undefined;
        }[] | undefined;
        approval_policies?: Record<string, {
            min_approvals: number;
            required_roles?: string[] | undefined;
            disallow_self_approval?: boolean | undefined;
            require_distinct_reviewers?: boolean | undefined;
            allow_needs_changes?: boolean | undefined;
        }> | undefined;
    } | undefined;
}>;
export type VibeConfig = z.infer<typeof configSchema>;
export type ProviderConfig = z.infer<typeof providerConfigSchema>;
