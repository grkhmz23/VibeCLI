import { z } from "zod";
export const policyProfileSchema = z.object({
    version: z.literal(1),
    name: z.string().min(1),
    description: z.string().min(1),
    routing: z.object({
        strategy: z.string().min(1),
        require_fallbacks_for_live_agents: z.boolean()
    }),
    security: z.object({
        require_secret_scan: z.boolean(),
        require_dependency_review: z.boolean(),
        require_authz_review: z.boolean(),
        require_cors_review: z.boolean(),
        require_jwt_review: z.boolean(),
        require_frontend_backend_boundary_review: z.boolean(),
        require_migration_review: z.boolean()
    }),
    verification: z.object({
        require_typecheck: z.boolean(),
        require_lint: z.boolean(),
        require_tests: z.boolean(),
        require_build: z.boolean()
    }),
    scanner: z.object({
        require_builtin_scanners: z.boolean(),
        require_external_scanners: z.boolean()
    }),
    approval: z.object({
        require_exact_confirmation: z.boolean(),
        require_review_before_apply: z.boolean(),
        require_workspace_before_apply: z.boolean()
    }),
    ledger: z.object({
        require_integrity_hashes: z.boolean(),
        require_signed_summary: z.boolean()
    }),
    release: z
        .object({
        require_ci_pass_for_production: z.boolean().default(true),
        require_deployment_readiness_for_production: z.boolean().default(true),
        require_ledger_verification: z.boolean().default(true),
        require_verification_before_release_packet: z.boolean().default(true),
        block_scanner_high_or_critical: z.boolean().default(true)
    })
        .default({
        require_ci_pass_for_production: true,
        require_deployment_readiness_for_production: true,
        require_ledger_verification: true,
        require_verification_before_release_packet: true,
        block_scanner_high_or_critical: true
    }),
    provenance: z
        .object({
        require_provenance_statement: z.boolean().default(false),
        require_signed_provenance: z.boolean().default(false),
        require_signed_evidence_for_release: z.boolean().default(false)
    })
        .default({
        require_provenance_statement: false,
        require_signed_provenance: false,
        require_signed_evidence_for_release: false
    }),
    github_release: z
        .object({
        allow_draft_creation: z.boolean().default(true),
        require_remote_tag_for_draft: z.boolean().default(true),
        allow_publish: z.literal(false).default(false),
        allow_asset_upload: z.literal(false).default(false)
    })
        .default({
        allow_draft_creation: true,
        require_remote_tag_for_draft: true,
        allow_publish: false,
        allow_asset_upload: false
    }),
    remote_attestation: z
        .object({
        allow_remote_submission: z.boolean().default(false),
        require_signed_provenance_for_submission: z.boolean().default(false),
        require_evidence_bundle_for_submission: z.boolean().default(false),
        require_ledger_pass_for_submission: z.boolean().default(true),
        require_transparency_entry_for_submission: z.boolean().default(false),
        allow_unsigned_internal_submission: z.boolean().default(true),
        allow_metadata_only_submission: z.boolean().default(true),
        require_https_targets: z.boolean().default(true)
    })
        .default({
        allow_remote_submission: false,
        require_signed_provenance_for_submission: false,
        require_evidence_bundle_for_submission: false,
        require_ledger_pass_for_submission: true,
        require_transparency_entry_for_submission: false,
        allow_unsigned_internal_submission: true,
        allow_metadata_only_submission: true,
        require_https_targets: true
    }),
    registry_metadata: z
        .object({
        require_registry_metadata_for_release: z.boolean().default(false),
        allow_registry_push: z.literal(false).default(false)
    })
        .default({
        require_registry_metadata_for_release: false,
        allow_registry_push: false
    }),
    organization: z
        .object({
        require_signed_policy_bundle_for_release: z.boolean().default(false),
        require_multi_reviewer_approval_for_production: z.boolean().default(false),
        require_remote_receipt_refresh_for_release: z.boolean().default(false),
        require_retention_plan_for_release: z.boolean().default(false)
    })
        .default({
        require_signed_policy_bundle_for_release: false,
        require_multi_reviewer_approval_for_production: false,
        require_remote_receipt_refresh_for_release: false,
        require_retention_plan_for_release: false
    }),
    audit: z
        .object({
        require_signed_audit_export_for_production: z.boolean().default(false),
        allow_certification_claims: z.literal(false).default(false)
    })
        .default({
        require_signed_audit_export_for_production: false,
        allow_certification_claims: false
    }),
    evidence_lifecycle: z
        .object({
        require_ledger_pass_for_production_archive: z.boolean().default(true),
        allow_delete_originals_after_archive: z.literal(false).default(false),
        allow_purge: z.literal(false).default(false)
    })
        .default({
        require_ledger_pass_for_production_archive: true,
        allow_delete_originals_after_archive: false,
        allow_purge: false
    }),
    evidence_disposal: z
        .object({
        require_retention_expired_for_production_disposal: z.boolean().default(true),
        require_no_legal_hold_for_disposal: z.boolean().default(true),
        require_archive_verification_for_disposal: z.boolean().default(true),
        require_retention_ledger_for_disposal: z.boolean().default(true),
        require_org_approval_for_production_disposal: z.boolean().default(false),
        require_disposal_attestation_for_disposal: z.boolean().default(true),
        allow_archive_deletion: z.literal(false).default(false),
        allow_key_deletion: z.literal(false).default(false),
        allow_source_deletion: z.literal(false).default(false),
        allow_remote_deletion: z.literal(false).default(false),
        allow_automatic_purge: z.literal(false).default(false)
    })
        .default({
        require_retention_expired_for_production_disposal: true,
        require_no_legal_hold_for_disposal: true,
        require_archive_verification_for_disposal: true,
        require_retention_ledger_for_disposal: true,
        require_org_approval_for_production_disposal: false,
        require_disposal_attestation_for_disposal: true,
        allow_archive_deletion: false,
        allow_key_deletion: false,
        allow_source_deletion: false,
        allow_remote_deletion: false,
        allow_automatic_purge: false
    }),
    budget: z.object({
        require_known_pricing: z.boolean(),
        max_run_cost_usd: z.number().positive()
    })
});
function profile(name, overrides = {}) {
    const base = {
        version: 1,
        name,
        description: `${name} VibeCLI organization policy profile`,
        routing: { strategy: "balanced", require_fallbacks_for_live_agents: true },
        security: {
            require_secret_scan: true,
            require_dependency_review: true,
            require_authz_review: true,
            require_cors_review: true,
            require_jwt_review: true,
            require_frontend_backend_boundary_review: true,
            require_migration_review: true
        },
        verification: {
            require_typecheck: true,
            require_lint: true,
            require_tests: true,
            require_build: true
        },
        scanner: { require_builtin_scanners: true, require_external_scanners: false },
        approval: {
            require_exact_confirmation: true,
            require_review_before_apply: true,
            require_workspace_before_apply: false
        },
        ledger: { require_integrity_hashes: true, require_signed_summary: true },
        release: {
            require_ci_pass_for_production: true,
            require_deployment_readiness_for_production: true,
            require_ledger_verification: true,
            require_verification_before_release_packet: true,
            block_scanner_high_or_critical: true
        },
        provenance: {
            require_provenance_statement: false,
            require_signed_provenance: false,
            require_signed_evidence_for_release: false
        },
        github_release: {
            allow_draft_creation: true,
            require_remote_tag_for_draft: true,
            allow_publish: false,
            allow_asset_upload: false
        },
        remote_attestation: {
            allow_remote_submission: false,
            require_signed_provenance_for_submission: false,
            require_evidence_bundle_for_submission: false,
            require_ledger_pass_for_submission: true,
            require_transparency_entry_for_submission: false,
            allow_unsigned_internal_submission: true,
            allow_metadata_only_submission: true,
            require_https_targets: true
        },
        registry_metadata: {
            require_registry_metadata_for_release: false,
            allow_registry_push: false
        },
        organization: {
            require_signed_policy_bundle_for_release: false,
            require_multi_reviewer_approval_for_production: false,
            require_remote_receipt_refresh_for_release: false,
            require_retention_plan_for_release: false
        },
        audit: {
            require_signed_audit_export_for_production: false,
            allow_certification_claims: false
        },
        evidence_lifecycle: {
            require_ledger_pass_for_production_archive: true,
            allow_delete_originals_after_archive: false,
            allow_purge: false
        },
        evidence_disposal: {
            require_retention_expired_for_production_disposal: true,
            require_no_legal_hold_for_disposal: true,
            require_archive_verification_for_disposal: true,
            require_retention_ledger_for_disposal: true,
            require_org_approval_for_production_disposal: false,
            require_disposal_attestation_for_disposal: true,
            allow_archive_deletion: false,
            allow_key_deletion: false,
            allow_source_deletion: false,
            allow_remote_deletion: false,
            allow_automatic_purge: false
        },
        budget: { require_known_pricing: false, max_run_cost_usd: 15 }
    };
    return { ...base, ...overrides };
}
export const defaultPolicyProfiles = {
    fast: profile("fast", {
        description: "Fast local policy with cheap routing and lighter verification expectations",
        routing: { strategy: "cheap", require_fallbacks_for_live_agents: false },
        verification: {
            require_typecheck: false,
            require_lint: true,
            require_tests: true,
            require_build: false
        },
        budget: { require_known_pricing: false, max_run_cost_usd: 5 }
    }),
    secure: profile("secure", {
        description: "Security-focused policy requiring scanner and review gates",
        routing: { strategy: "strongest", require_fallbacks_for_live_agents: true },
        scanner: { require_builtin_scanners: true, require_external_scanners: true },
        provenance: {
            require_provenance_statement: true,
            require_signed_provenance: false,
            require_signed_evidence_for_release: false
        },
        remote_attestation: {
            allow_remote_submission: false,
            require_signed_provenance_for_submission: true,
            require_evidence_bundle_for_submission: true,
            require_ledger_pass_for_submission: true,
            require_transparency_entry_for_submission: true,
            allow_unsigned_internal_submission: false,
            allow_metadata_only_submission: true,
            require_https_targets: true
        }
    }),
    "company-grade": profile("company-grade", {
        description: "Balanced company-grade delivery policy",
        provenance: {
            require_provenance_statement: true,
            require_signed_provenance: false,
            require_signed_evidence_for_release: false
        },
        remote_attestation: {
            allow_remote_submission: false,
            require_signed_provenance_for_submission: true,
            require_evidence_bundle_for_submission: true,
            require_ledger_pass_for_submission: true,
            require_transparency_entry_for_submission: true,
            allow_unsigned_internal_submission: false,
            allow_metadata_only_submission: true,
            require_https_targets: true
        },
        registry_metadata: {
            require_registry_metadata_for_release: true,
            allow_registry_push: false
        },
        organization: {
            require_signed_policy_bundle_for_release: true,
            require_multi_reviewer_approval_for_production: false,
            require_remote_receipt_refresh_for_release: false,
            require_retention_plan_for_release: false
        },
        audit: {
            require_signed_audit_export_for_production: false,
            allow_certification_claims: false
        }
    }),
    "strict-enterprise": profile("strict-enterprise", {
        description: "Strict enterprise policy with exact confirmations and external scanner expectations",
        routing: { strategy: "strongest", require_fallbacks_for_live_agents: true },
        scanner: { require_builtin_scanners: true, require_external_scanners: true },
        approval: {
            require_exact_confirmation: true,
            require_review_before_apply: true,
            require_workspace_before_apply: true
        },
        provenance: {
            require_provenance_statement: true,
            require_signed_provenance: true,
            require_signed_evidence_for_release: true
        },
        remote_attestation: {
            allow_remote_submission: false,
            require_signed_provenance_for_submission: true,
            require_evidence_bundle_for_submission: true,
            require_ledger_pass_for_submission: true,
            require_transparency_entry_for_submission: true,
            allow_unsigned_internal_submission: false,
            allow_metadata_only_submission: true,
            require_https_targets: true
        },
        registry_metadata: {
            require_registry_metadata_for_release: true,
            allow_registry_push: false
        },
        organization: {
            require_signed_policy_bundle_for_release: true,
            require_multi_reviewer_approval_for_production: true,
            require_remote_receipt_refresh_for_release: true,
            require_retention_plan_for_release: true
        },
        audit: {
            require_signed_audit_export_for_production: true,
            allow_certification_claims: false
        },
        evidence_disposal: {
            require_retention_expired_for_production_disposal: true,
            require_no_legal_hold_for_disposal: true,
            require_archive_verification_for_disposal: true,
            require_retention_ledger_for_disposal: true,
            require_org_approval_for_production_disposal: true,
            require_disposal_attestation_for_disposal: true,
            allow_archive_deletion: false,
            allow_key_deletion: false,
            allow_source_deletion: false,
            allow_remote_deletion: false,
            allow_automatic_purge: false
        },
        budget: { require_known_pricing: true, max_run_cost_usd: 10 }
    })
};
//# sourceMappingURL=profile.js.map