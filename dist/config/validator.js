import { requiredSecurityPolicy } from "./defaults.js";
import { loadSecurityPolicy } from "./config.js";
import { validateBranchName, validateBranchPrefix } from "../git-lifecycle/validation.js";
import { validateRemoteAttestationConfig } from "../remote-attestation/validation.js";
import { validateOrganizationConfig } from "../org/validation.js";
import { validateAuditConfig } from "../audit/validation.js";
import { validateEvidenceLifecycleConfig } from "../evidence-lifecycle/validation.js";
import { validateDisposalConfig } from "../evidence-disposal/validation.js";
import { validateDogfoodConfig } from "../dogfood/validation.js";
import { validateBetaConfig } from "../beta/validation.js";
const secretLike = /(sk-[A-Za-z0-9_-]{20,}|[A-Za-z0-9_=-]{32,})/;
const requiredDangerousPatterns = ["rm -rf", "sudo", "curl | bash", "OPENAI_API_KEY"];
export async function validateTeamConfig(cwd, config) {
    const errors = [];
    const warnings = [];
    for (const [profileName, profile] of Object.entries(config.profiles)) {
        for (const [agent, agentConfig] of Object.entries(profile.agents)) {
            if (!config.providers[agentConfig.provider]) {
                errors.push(`Profile ${profileName} agent ${agent} references missing provider ${agentConfig.provider}`);
            }
            if (agentConfig.model && agentConfig.model_alias) {
                errors.push(`Profile ${profileName} agent ${agent} sets both model and model_alias`);
            }
            if (agentConfig.model_alias && !config.model_aliases[agentConfig.model_alias]) {
                errors.push(`Profile ${profileName} agent ${agent} references missing alias ${agentConfig.model_alias}`);
            }
            for (const fallback of agentConfig.fallback_models ?? []) {
                const provider = fallback.model_alias
                    ? config.model_aliases[fallback.model_alias]?.provider
                    : fallback.provider;
                if (!provider || !config.providers[provider]) {
                    errors.push(`Profile ${profileName} agent ${agent} fallback references missing provider ${provider ?? "unknown"}`);
                }
                if (fallback.model && fallback.model_alias) {
                    errors.push(`Profile ${profileName} agent ${agent} fallback sets both model and model_alias`);
                }
            }
        }
    }
    for (const [name, provider] of Object.entries(config.providers)) {
        if ("api_key_env" in provider) {
            if (secretLike.test(provider.api_key_env)) {
                errors.push(`Provider ${name} api_key_env looks like an actual secret; store only env var names`);
            }
            if (!/^[A-Z_][A-Z0-9_]*$/.test(provider.api_key_env)) {
                warnings.push(`Provider ${name} api_key_env should be an uppercase env var name`);
            }
        }
    }
    try {
        validateBranchPrefix(config.git_lifecycle.branch_prefix);
    }
    catch (error) {
        errors.push(`git_lifecycle.branch_prefix is unsafe: ${error instanceof Error ? error.message : String(error)}`);
    }
    for (const branch of config.git_lifecycle.protected_branches) {
        try {
            validateBranchName(branch);
        }
        catch (error) {
            errors.push(`git_lifecycle.protected_branches contains unsafe branch ${branch}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    if (config.release.allowed_channels.length === 0) {
        errors.push("release.allowed_channels must be non-empty");
    }
    if (!config.release.allowed_channels.includes(config.release.default_channel)) {
        errors.push("release.default_channel must be in release.allowed_channels");
    }
    if (config.release.default_channel === "production") {
        warnings.push("release.default_channel is production; this should be set only intentionally");
    }
    if (config.release.versioning.strategy !== "semver") {
        errors.push("release.versioning.strategy must be semver");
    }
    for (const identifier of config.release.versioning.prerelease_identifiers) {
        if (!/^[a-z][a-z0-9-]*$/.test(identifier)) {
            errors.push(`release prerelease identifier is unsafe: ${identifier}`);
        }
    }
    try {
        validateBranchPrefix(config.release.release_branch.prefix);
    }
    catch (error) {
        errors.push(`release.release_branch.prefix is unsafe: ${error instanceof Error ? error.message : String(error)}`);
    }
    try {
        validateBranchPrefix(config.release.tags.prefix);
    }
    catch (error) {
        errors.push(`release.tags.prefix is unsafe: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (config.release.deployment.execute_deploy_commands) {
        errors.push("release.deployment.execute_deploy_commands must remain false in Phase 9");
    }
    if (config.provenance.format !== "slsa-inspired") {
        errors.push("provenance.format must be slsa-inspired");
    }
    if (config.provenance.signing.algorithm !== "ed25519") {
        errors.push("provenance.signing.algorithm must be ed25519");
    }
    if (config.provenance.signing.key_dir !== ".vibecli/keys" &&
        !config.provenance.signing.key_dir.startsWith(".vibecli/keys/")) {
        errors.push("provenance.signing.key_dir must be inside .vibecli/keys");
    }
    if (!config.provenance.signing.private_key_file.endsWith(".private.pem")) {
        errors.push("provenance.signing.private_key_file must end in .private.pem");
    }
    if (!config.provenance.signing.public_key_file.endsWith(".public.pem")) {
        errors.push("provenance.signing.public_key_file must end in .public.pem");
    }
    if (config.provenance.github_release.publish_releases) {
        errors.push("provenance.github_release.publish_releases must remain false in Phase 10");
    }
    if (config.provenance.github_release.upload_assets) {
        errors.push("provenance.github_release.upload_assets must remain false in Phase 10");
    }
    if (config.provenance.github_release.allow_draft_creation &&
        !config.provenance.github_release.require_release_readiness_for_production_draft) {
        errors.push("GitHub release draft creation cannot bypass production release-readiness checks");
    }
    errors.push(...validateRemoteAttestationConfig(config.remote_attestation));
    errors.push(...validateOrganizationConfig(config.organization));
    errors.push(...validateAuditConfig(config.audit));
    errors.push(...validateEvidenceLifecycleConfig(config.evidence_lifecycle));
    errors.push(...validateDisposalConfig(config.evidence_disposal));
    errors.push(...validateDogfoodConfig(config.dogfood));
    errors.push(...validateBetaConfig(config.beta));
    if (!config.git_lifecycle.stage_only_applied_files) {
        warnings.push("git_lifecycle.stage_only_applied_files should remain true for team safety");
    }
    const policy = await loadSecurityPolicy(cwd).catch(() => undefined);
    if (policy) {
        for (const key of Object.keys(requiredSecurityPolicy)) {
            if (!(key in policy))
                errors.push(`Security policy missing required check ${key}`);
        }
    }
    for (const pattern of requiredDangerousPatterns) {
        if (!pattern)
            errors.push("Invalid required command denylist pattern");
    }
    return { ok: errors.length === 0, errors, warnings };
}
//# sourceMappingURL=validator.js.map