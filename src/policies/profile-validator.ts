import { defaultPolicyProfiles } from "./profile.js";
import { listPolicyProfileNames, loadPolicyProfile } from "./profile-loader.js";

export type PolicyValidationResult = {
  ok: boolean;
  profile?: string;
  errors: string[];
};

export async function validatePolicyProfile(
  cwd: string,
  name: string
): Promise<PolicyValidationResult> {
  const errors: string[] = [];
  try {
    const profile = await loadPolicyProfile(cwd, name);
    if (profile.name !== name)
      errors.push(`Profile file name ${name} does not match name ${profile.name}`);
    if (name === "strict-enterprise" && !profile.approval.require_exact_confirmation) {
      errors.push("strict-enterprise cannot disable exact confirmation");
    }
    if (name === "strict-enterprise") {
      if (!profile.release.require_ci_pass_for_production) {
        errors.push("strict-enterprise cannot disable production CI release gate");
      }
      if (!profile.release.require_deployment_readiness_for_production) {
        errors.push("strict-enterprise cannot disable production deployment-readiness gate");
      }
      if (!profile.release.require_ledger_verification) {
        errors.push("strict-enterprise cannot disable release ledger verification");
      }
      if (!profile.release.require_verification_before_release_packet) {
        errors.push("strict-enterprise cannot disable verification before release packet");
      }
      if (!profile.release.block_scanner_high_or_critical) {
        errors.push("strict-enterprise cannot disable high/critical scanner blocking");
      }
      if (!profile.provenance.require_signed_provenance) {
        errors.push("strict-enterprise cannot disable signed provenance");
      }
      if (profile.remote_attestation.allow_unsigned_internal_submission) {
        errors.push("strict-enterprise cannot allow unsigned remote submission");
      }
      if (!profile.organization.require_multi_reviewer_approval_for_production) {
        errors.push("strict-enterprise cannot disable multi-reviewer production approval");
      }
      if (!profile.audit.require_signed_audit_export_for_production) {
        errors.push(
          "strict-enterprise cannot disable signed audit export for production audit handoff"
        );
      }
      if (!profile.evidence_lifecycle.require_ledger_pass_for_production_archive) {
        errors.push(
          "strict-enterprise cannot disable ledger pass requirement for production archives"
        );
      }
      if (!profile.evidence_disposal.require_retention_expired_for_production_disposal) {
        errors.push("strict-enterprise cannot disable retention expiry for production disposal");
      }
      if (!profile.evidence_disposal.require_no_legal_hold_for_disposal) {
        errors.push("strict-enterprise cannot disable legal hold blocking for disposal");
      }
      if (!profile.evidence_disposal.require_archive_verification_for_disposal) {
        errors.push("strict-enterprise cannot disable archive verification for disposal");
      }
      if (!profile.evidence_disposal.require_retention_ledger_for_disposal) {
        errors.push("strict-enterprise cannot disable retention ledger for disposal");
      }
      if (!profile.evidence_disposal.require_org_approval_for_production_disposal) {
        errors.push("strict-enterprise cannot disable org approval for production disposal");
      }
      if (!profile.evidence_disposal.require_disposal_attestation_for_disposal) {
        errors.push("strict-enterprise cannot disable disposal attestation");
      }
    }
    if (profile.github_release.allow_publish) {
      errors.push("Policy profiles cannot allow GitHub release publishing in Phase 10");
    }
    if (profile.github_release.allow_asset_upload) {
      errors.push("Policy profiles cannot allow GitHub release asset upload in Phase 10");
    }
    if (profile.registry_metadata.allow_registry_push) {
      errors.push("Policy profiles cannot allow registry push in Phase 11");
    }
    if (profile.audit.allow_certification_claims) {
      errors.push("Policy profiles cannot allow audit certification claims in Phase 13");
    }
    if (profile.evidence_lifecycle.allow_delete_originals_after_archive) {
      errors.push("Policy profiles cannot allow evidence deletion after archive in Phase 14");
    }
    if (profile.evidence_lifecycle.allow_purge) {
      errors.push("Policy profiles cannot allow evidence purge in Phase 14");
    }
    if (profile.evidence_disposal.allow_archive_deletion) {
      errors.push("Policy profiles cannot allow archive deletion in Phase 15");
    }
    if (profile.evidence_disposal.allow_key_deletion) {
      errors.push("Policy profiles cannot allow key deletion in Phase 15");
    }
    if (profile.evidence_disposal.allow_source_deletion) {
      errors.push("Policy profiles cannot allow source deletion in Phase 15");
    }
    if (profile.evidence_disposal.allow_remote_deletion) {
      errors.push("Policy profiles cannot allow remote deletion in Phase 15");
    }
    if (profile.evidence_disposal.allow_automatic_purge) {
      errors.push("Policy profiles cannot allow automatic purge in Phase 15");
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  return { ok: errors.length === 0, profile: name, errors };
}

export async function validatePolicyProfiles(
  cwd: string,
  name?: string
): Promise<PolicyValidationResult[]> {
  const names = name ? [name] : await listPolicyProfileNames(cwd);
  const required = name ? [] : Object.keys(defaultPolicyProfiles);
  const missing = required.filter((requiredName) => !names.includes(requiredName));
  const results = await Promise.all(
    names.map((profileName) => validatePolicyProfile(cwd, profileName))
  );
  return [
    ...results,
    ...missing.map((profileName) => ({
      ok: false,
      profile: profileName,
      errors: [`Required policy profile ${profileName} is missing`]
    }))
  ];
}
