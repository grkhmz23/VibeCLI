const secretLike = /(sk-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9_]{12,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|bearer\s+[A-Za-z0-9._-]{16,}|[a-z]+:\/\/[^:\s/]+:[^@\s/]+@)/i;
const modes = new Set(["minimal", "audit", "forensic_redacted"]);
export function validateEvidenceLifecycleConfig(config) {
    const errors = [];
    if (!underVibe(config.archive_dir))
        errors.push("evidence_lifecycle.archive_dir must be under .vibecli");
    if (!underVibe(config.lifecycle_dir))
        errors.push("evidence_lifecycle.lifecycle_dir must be under .vibecli");
    if (!underVibe(config.retention_ledger_dir)) {
        errors.push("evidence_lifecycle.retention_ledger_dir must be under .vibecli");
    }
    if (!config.allowed_archive_modes.every((mode) => modes.has(mode))) {
        errors.push("evidence_lifecycle.allowed_archive_modes contains unsupported values");
    }
    if (!config.allowed_archive_modes.includes(config.default_archive_mode)) {
        errors.push("evidence_lifecycle.default_archive_mode must be allowed");
    }
    if (config.delete_originals_after_archive) {
        errors.push("evidence_lifecycle.delete_originals_after_archive must remain false in Phase 14");
    }
    if (config.purge_enabled) {
        errors.push("evidence_lifecycle.purge_enabled must remain false in Phase 14");
    }
    if (config.max_archive_bytes <= 0 || config.max_archive_bytes > 100_000_000) {
        errors.push("evidence_lifecycle.max_archive_bytes must be positive and bounded");
    }
    if (!config.redaction.exclude_private_keys) {
        errors.push("evidence_lifecycle.redaction.exclude_private_keys must remain true");
    }
    if (!config.redaction.exclude_env_files) {
        errors.push("evidence_lifecycle.redaction.exclude_env_files must remain true");
    }
    if (!config.redaction.redact_secret_like_values) {
        errors.push("evidence_lifecycle.redaction.redact_secret_like_values must remain true");
    }
    for (const [key, value] of Object.entries(flatten(config))) {
        if (secretLike.test(String(value))) {
            errors.push(`evidence_lifecycle.${key} looks like a raw secret`);
        }
    }
    return errors;
}
function underVibe(path) {
    return path === ".vibecli" || path.startsWith(".vibecli/");
}
function flatten(value, prefix = "") {
    if (Array.isArray(value)) {
        return Object.fromEntries(value.flatMap((entry, index) => Object.entries(flatten(entry, `${prefix}${index}.`))));
    }
    if (typeof value === "object" && value !== null) {
        return Object.fromEntries(Object.entries(value).flatMap(([key, entry]) => Object.entries(flatten(entry, `${prefix}${key}.`))));
    }
    return { [prefix.replace(/\.$/, "")]: String(value) };
}
//# sourceMappingURL=validation.js.map