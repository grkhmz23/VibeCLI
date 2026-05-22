import { z } from "zod";
export declare const policyProfileSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    name: z.ZodString;
    description: z.ZodString;
    routing: z.ZodObject<{
        strategy: z.ZodString;
        require_fallbacks_for_live_agents: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        strategy: string;
        require_fallbacks_for_live_agents: boolean;
    }, {
        strategy: string;
        require_fallbacks_for_live_agents: boolean;
    }>;
    security: z.ZodObject<{
        require_secret_scan: z.ZodBoolean;
        require_dependency_review: z.ZodBoolean;
        require_authz_review: z.ZodBoolean;
        require_cors_review: z.ZodBoolean;
        require_jwt_review: z.ZodBoolean;
        require_frontend_backend_boundary_review: z.ZodBoolean;
        require_migration_review: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        require_secret_scan: boolean;
        require_dependency_review: boolean;
        require_authz_review: boolean;
        require_cors_review: boolean;
        require_jwt_review: boolean;
        require_frontend_backend_boundary_review: boolean;
        require_migration_review: boolean;
    }, {
        require_secret_scan: boolean;
        require_dependency_review: boolean;
        require_authz_review: boolean;
        require_cors_review: boolean;
        require_jwt_review: boolean;
        require_frontend_backend_boundary_review: boolean;
        require_migration_review: boolean;
    }>;
    verification: z.ZodObject<{
        require_typecheck: z.ZodBoolean;
        require_lint: z.ZodBoolean;
        require_tests: z.ZodBoolean;
        require_build: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        require_typecheck: boolean;
        require_lint: boolean;
        require_tests: boolean;
        require_build: boolean;
    }, {
        require_typecheck: boolean;
        require_lint: boolean;
        require_tests: boolean;
        require_build: boolean;
    }>;
    scanner: z.ZodObject<{
        require_builtin_scanners: z.ZodBoolean;
        require_external_scanners: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        require_builtin_scanners: boolean;
        require_external_scanners: boolean;
    }, {
        require_builtin_scanners: boolean;
        require_external_scanners: boolean;
    }>;
    approval: z.ZodObject<{
        require_exact_confirmation: z.ZodBoolean;
        require_review_before_apply: z.ZodBoolean;
        require_workspace_before_apply: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        require_exact_confirmation: boolean;
        require_review_before_apply: boolean;
        require_workspace_before_apply: boolean;
    }, {
        require_exact_confirmation: boolean;
        require_review_before_apply: boolean;
        require_workspace_before_apply: boolean;
    }>;
    ledger: z.ZodObject<{
        require_integrity_hashes: z.ZodBoolean;
        require_signed_summary: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        require_integrity_hashes: boolean;
        require_signed_summary: boolean;
    }, {
        require_integrity_hashes: boolean;
        require_signed_summary: boolean;
    }>;
    release: z.ZodDefault<z.ZodObject<{
        require_ci_pass_for_production: z.ZodDefault<z.ZodBoolean>;
        require_deployment_readiness_for_production: z.ZodDefault<z.ZodBoolean>;
        require_ledger_verification: z.ZodDefault<z.ZodBoolean>;
        require_verification_before_release_packet: z.ZodDefault<z.ZodBoolean>;
        block_scanner_high_or_critical: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        require_ci_pass_for_production: boolean;
        require_deployment_readiness_for_production: boolean;
        require_ledger_verification: boolean;
        require_verification_before_release_packet: boolean;
        block_scanner_high_or_critical: boolean;
    }, {
        require_ci_pass_for_production?: boolean | undefined;
        require_deployment_readiness_for_production?: boolean | undefined;
        require_ledger_verification?: boolean | undefined;
        require_verification_before_release_packet?: boolean | undefined;
        block_scanner_high_or_critical?: boolean | undefined;
    }>>;
    provenance: z.ZodDefault<z.ZodObject<{
        require_provenance_statement: z.ZodDefault<z.ZodBoolean>;
        require_signed_provenance: z.ZodDefault<z.ZodBoolean>;
        require_signed_evidence_for_release: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        require_signed_provenance: boolean;
        require_provenance_statement: boolean;
        require_signed_evidence_for_release: boolean;
    }, {
        require_signed_provenance?: boolean | undefined;
        require_provenance_statement?: boolean | undefined;
        require_signed_evidence_for_release?: boolean | undefined;
    }>>;
    github_release: z.ZodDefault<z.ZodObject<{
        allow_draft_creation: z.ZodDefault<z.ZodBoolean>;
        require_remote_tag_for_draft: z.ZodDefault<z.ZodBoolean>;
        allow_publish: z.ZodDefault<z.ZodLiteral<false>>;
        allow_asset_upload: z.ZodDefault<z.ZodLiteral<false>>;
    }, "strip", z.ZodTypeAny, {
        allow_draft_creation: boolean;
        require_remote_tag_for_draft: boolean;
        allow_publish: false;
        allow_asset_upload: false;
    }, {
        allow_draft_creation?: boolean | undefined;
        require_remote_tag_for_draft?: boolean | undefined;
        allow_publish?: false | undefined;
        allow_asset_upload?: false | undefined;
    }>>;
    remote_attestation: z.ZodDefault<z.ZodObject<{
        allow_remote_submission: z.ZodDefault<z.ZodBoolean>;
        require_signed_provenance_for_submission: z.ZodDefault<z.ZodBoolean>;
        require_evidence_bundle_for_submission: z.ZodDefault<z.ZodBoolean>;
        require_ledger_pass_for_submission: z.ZodDefault<z.ZodBoolean>;
        require_transparency_entry_for_submission: z.ZodDefault<z.ZodBoolean>;
        allow_unsigned_internal_submission: z.ZodDefault<z.ZodBoolean>;
        allow_metadata_only_submission: z.ZodDefault<z.ZodBoolean>;
        require_https_targets: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        allow_remote_submission: boolean;
        require_https_targets: boolean;
        require_signed_provenance_for_submission: boolean;
        require_evidence_bundle_for_submission: boolean;
        require_ledger_pass_for_submission: boolean;
        require_transparency_entry_for_submission: boolean;
        allow_unsigned_internal_submission: boolean;
        allow_metadata_only_submission: boolean;
    }, {
        allow_remote_submission?: boolean | undefined;
        require_https_targets?: boolean | undefined;
        require_signed_provenance_for_submission?: boolean | undefined;
        require_evidence_bundle_for_submission?: boolean | undefined;
        require_ledger_pass_for_submission?: boolean | undefined;
        require_transparency_entry_for_submission?: boolean | undefined;
        allow_unsigned_internal_submission?: boolean | undefined;
        allow_metadata_only_submission?: boolean | undefined;
    }>>;
    registry_metadata: z.ZodDefault<z.ZodObject<{
        require_registry_metadata_for_release: z.ZodDefault<z.ZodBoolean>;
        allow_registry_push: z.ZodDefault<z.ZodLiteral<false>>;
    }, "strip", z.ZodTypeAny, {
        require_registry_metadata_for_release: boolean;
        allow_registry_push: false;
    }, {
        require_registry_metadata_for_release?: boolean | undefined;
        allow_registry_push?: false | undefined;
    }>>;
    organization: z.ZodDefault<z.ZodObject<{
        require_signed_policy_bundle_for_release: z.ZodDefault<z.ZodBoolean>;
        require_multi_reviewer_approval_for_production: z.ZodDefault<z.ZodBoolean>;
        require_remote_receipt_refresh_for_release: z.ZodDefault<z.ZodBoolean>;
        require_retention_plan_for_release: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        require_remote_receipt_refresh_for_release: boolean;
        require_retention_plan_for_release: boolean;
        require_signed_policy_bundle_for_release: boolean;
        require_multi_reviewer_approval_for_production: boolean;
    }, {
        require_remote_receipt_refresh_for_release?: boolean | undefined;
        require_retention_plan_for_release?: boolean | undefined;
        require_signed_policy_bundle_for_release?: boolean | undefined;
        require_multi_reviewer_approval_for_production?: boolean | undefined;
    }>>;
    audit: z.ZodDefault<z.ZodObject<{
        require_signed_audit_export_for_production: z.ZodDefault<z.ZodBoolean>;
        allow_certification_claims: z.ZodDefault<z.ZodLiteral<false>>;
    }, "strip", z.ZodTypeAny, {
        require_signed_audit_export_for_production: boolean;
        allow_certification_claims: false;
    }, {
        require_signed_audit_export_for_production?: boolean | undefined;
        allow_certification_claims?: false | undefined;
    }>>;
    evidence_lifecycle: z.ZodDefault<z.ZodObject<{
        require_ledger_pass_for_production_archive: z.ZodDefault<z.ZodBoolean>;
        allow_delete_originals_after_archive: z.ZodDefault<z.ZodLiteral<false>>;
        allow_purge: z.ZodDefault<z.ZodLiteral<false>>;
    }, "strip", z.ZodTypeAny, {
        require_ledger_pass_for_production_archive: boolean;
        allow_delete_originals_after_archive: false;
        allow_purge: false;
    }, {
        require_ledger_pass_for_production_archive?: boolean | undefined;
        allow_delete_originals_after_archive?: false | undefined;
        allow_purge?: false | undefined;
    }>>;
    evidence_disposal: z.ZodDefault<z.ZodObject<{
        require_retention_expired_for_production_disposal: z.ZodDefault<z.ZodBoolean>;
        require_no_legal_hold_for_disposal: z.ZodDefault<z.ZodBoolean>;
        require_archive_verification_for_disposal: z.ZodDefault<z.ZodBoolean>;
        require_retention_ledger_for_disposal: z.ZodDefault<z.ZodBoolean>;
        require_org_approval_for_production_disposal: z.ZodDefault<z.ZodBoolean>;
        require_disposal_attestation_for_disposal: z.ZodDefault<z.ZodBoolean>;
        allow_archive_deletion: z.ZodDefault<z.ZodLiteral<false>>;
        allow_key_deletion: z.ZodDefault<z.ZodLiteral<false>>;
        allow_source_deletion: z.ZodDefault<z.ZodLiteral<false>>;
        allow_remote_deletion: z.ZodDefault<z.ZodLiteral<false>>;
        allow_automatic_purge: z.ZodDefault<z.ZodLiteral<false>>;
    }, "strip", z.ZodTypeAny, {
        allow_archive_deletion: false;
        allow_key_deletion: false;
        allow_source_deletion: false;
        allow_remote_deletion: false;
        allow_automatic_purge: false;
        require_retention_expired_for_production_disposal: boolean;
        require_no_legal_hold_for_disposal: boolean;
        require_archive_verification_for_disposal: boolean;
        require_retention_ledger_for_disposal: boolean;
        require_org_approval_for_production_disposal: boolean;
        require_disposal_attestation_for_disposal: boolean;
    }, {
        allow_archive_deletion?: false | undefined;
        allow_key_deletion?: false | undefined;
        allow_source_deletion?: false | undefined;
        allow_remote_deletion?: false | undefined;
        allow_automatic_purge?: false | undefined;
        require_retention_expired_for_production_disposal?: boolean | undefined;
        require_no_legal_hold_for_disposal?: boolean | undefined;
        require_archive_verification_for_disposal?: boolean | undefined;
        require_retention_ledger_for_disposal?: boolean | undefined;
        require_org_approval_for_production_disposal?: boolean | undefined;
        require_disposal_attestation_for_disposal?: boolean | undefined;
    }>>;
    budget: z.ZodObject<{
        require_known_pricing: z.ZodBoolean;
        max_run_cost_usd: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        max_run_cost_usd: number;
        require_known_pricing: boolean;
    }, {
        max_run_cost_usd: number;
        require_known_pricing: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    scanner: {
        require_builtin_scanners: boolean;
        require_external_scanners: boolean;
    };
    security: {
        require_secret_scan: boolean;
        require_dependency_review: boolean;
        require_authz_review: boolean;
        require_cors_review: boolean;
        require_jwt_review: boolean;
        require_frontend_backend_boundary_review: boolean;
        require_migration_review: boolean;
    };
    audit: {
        require_signed_audit_export_for_production: boolean;
        allow_certification_claims: false;
    };
    version: 1;
    routing: {
        strategy: string;
        require_fallbacks_for_live_agents: boolean;
    };
    budget: {
        max_run_cost_usd: number;
        require_known_pricing: boolean;
    };
    release: {
        require_ci_pass_for_production: boolean;
        require_deployment_readiness_for_production: boolean;
        require_ledger_verification: boolean;
        require_verification_before_release_packet: boolean;
        block_scanner_high_or_critical: boolean;
    };
    github_release: {
        allow_draft_creation: boolean;
        require_remote_tag_for_draft: boolean;
        allow_publish: false;
        allow_asset_upload: false;
    };
    provenance: {
        require_signed_provenance: boolean;
        require_provenance_statement: boolean;
        require_signed_evidence_for_release: boolean;
    };
    remote_attestation: {
        allow_remote_submission: boolean;
        require_https_targets: boolean;
        require_signed_provenance_for_submission: boolean;
        require_evidence_bundle_for_submission: boolean;
        require_ledger_pass_for_submission: boolean;
        require_transparency_entry_for_submission: boolean;
        allow_unsigned_internal_submission: boolean;
        allow_metadata_only_submission: boolean;
    };
    evidence_lifecycle: {
        require_ledger_pass_for_production_archive: boolean;
        allow_delete_originals_after_archive: false;
        allow_purge: false;
    };
    evidence_disposal: {
        allow_archive_deletion: false;
        allow_key_deletion: false;
        allow_source_deletion: false;
        allow_remote_deletion: false;
        allow_automatic_purge: false;
        require_retention_expired_for_production_disposal: boolean;
        require_no_legal_hold_for_disposal: boolean;
        require_archive_verification_for_disposal: boolean;
        require_retention_ledger_for_disposal: boolean;
        require_org_approval_for_production_disposal: boolean;
        require_disposal_attestation_for_disposal: boolean;
    };
    organization: {
        require_remote_receipt_refresh_for_release: boolean;
        require_retention_plan_for_release: boolean;
        require_signed_policy_bundle_for_release: boolean;
        require_multi_reviewer_approval_for_production: boolean;
    };
    name: string;
    description: string;
    verification: {
        require_typecheck: boolean;
        require_lint: boolean;
        require_tests: boolean;
        require_build: boolean;
    };
    approval: {
        require_exact_confirmation: boolean;
        require_review_before_apply: boolean;
        require_workspace_before_apply: boolean;
    };
    ledger: {
        require_integrity_hashes: boolean;
        require_signed_summary: boolean;
    };
    registry_metadata: {
        require_registry_metadata_for_release: boolean;
        allow_registry_push: false;
    };
}, {
    scanner: {
        require_builtin_scanners: boolean;
        require_external_scanners: boolean;
    };
    security: {
        require_secret_scan: boolean;
        require_dependency_review: boolean;
        require_authz_review: boolean;
        require_cors_review: boolean;
        require_jwt_review: boolean;
        require_frontend_backend_boundary_review: boolean;
        require_migration_review: boolean;
    };
    version: 1;
    routing: {
        strategy: string;
        require_fallbacks_for_live_agents: boolean;
    };
    budget: {
        max_run_cost_usd: number;
        require_known_pricing: boolean;
    };
    name: string;
    description: string;
    verification: {
        require_typecheck: boolean;
        require_lint: boolean;
        require_tests: boolean;
        require_build: boolean;
    };
    approval: {
        require_exact_confirmation: boolean;
        require_review_before_apply: boolean;
        require_workspace_before_apply: boolean;
    };
    ledger: {
        require_integrity_hashes: boolean;
        require_signed_summary: boolean;
    };
    audit?: {
        require_signed_audit_export_for_production?: boolean | undefined;
        allow_certification_claims?: false | undefined;
    } | undefined;
    release?: {
        require_ci_pass_for_production?: boolean | undefined;
        require_deployment_readiness_for_production?: boolean | undefined;
        require_ledger_verification?: boolean | undefined;
        require_verification_before_release_packet?: boolean | undefined;
        block_scanner_high_or_critical?: boolean | undefined;
    } | undefined;
    github_release?: {
        allow_draft_creation?: boolean | undefined;
        require_remote_tag_for_draft?: boolean | undefined;
        allow_publish?: false | undefined;
        allow_asset_upload?: false | undefined;
    } | undefined;
    provenance?: {
        require_signed_provenance?: boolean | undefined;
        require_provenance_statement?: boolean | undefined;
        require_signed_evidence_for_release?: boolean | undefined;
    } | undefined;
    remote_attestation?: {
        allow_remote_submission?: boolean | undefined;
        require_https_targets?: boolean | undefined;
        require_signed_provenance_for_submission?: boolean | undefined;
        require_evidence_bundle_for_submission?: boolean | undefined;
        require_ledger_pass_for_submission?: boolean | undefined;
        require_transparency_entry_for_submission?: boolean | undefined;
        allow_unsigned_internal_submission?: boolean | undefined;
        allow_metadata_only_submission?: boolean | undefined;
    } | undefined;
    evidence_lifecycle?: {
        require_ledger_pass_for_production_archive?: boolean | undefined;
        allow_delete_originals_after_archive?: false | undefined;
        allow_purge?: false | undefined;
    } | undefined;
    evidence_disposal?: {
        allow_archive_deletion?: false | undefined;
        allow_key_deletion?: false | undefined;
        allow_source_deletion?: false | undefined;
        allow_remote_deletion?: false | undefined;
        allow_automatic_purge?: false | undefined;
        require_retention_expired_for_production_disposal?: boolean | undefined;
        require_no_legal_hold_for_disposal?: boolean | undefined;
        require_archive_verification_for_disposal?: boolean | undefined;
        require_retention_ledger_for_disposal?: boolean | undefined;
        require_org_approval_for_production_disposal?: boolean | undefined;
        require_disposal_attestation_for_disposal?: boolean | undefined;
    } | undefined;
    organization?: {
        require_remote_receipt_refresh_for_release?: boolean | undefined;
        require_retention_plan_for_release?: boolean | undefined;
        require_signed_policy_bundle_for_release?: boolean | undefined;
        require_multi_reviewer_approval_for_production?: boolean | undefined;
    } | undefined;
    registry_metadata?: {
        require_registry_metadata_for_release?: boolean | undefined;
        allow_registry_push?: false | undefined;
    } | undefined;
}>;
export type PolicyProfile = z.infer<typeof policyProfileSchema>;
export declare const defaultPolicyProfiles: Record<string, PolicyProfile>;
