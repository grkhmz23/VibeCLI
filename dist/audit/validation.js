const safeToken = /^[a-z0-9][a-z0-9_-]*$/;
const safeControlId = /^[A-Z0-9][A-Z0-9_-]*$/;
const secretLike = /(sk-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9_]{12,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|bearer\s+[A-Za-z0-9._-]{16,}|[a-z]+:\/\/[^:\s/]+:[^@\s/]+@)/i;
const certificationClaim = /\b(certified compliant|certifies compliance|is compliant with|guarantees compliance|attests compliance)\b/i;
export const auditCategories = [
    "security",
    "authentication",
    "authorization",
    "secrets",
    "api-boundary",
    "cors",
    "jwt-session",
    "database-migrations",
    "dependency-hygiene",
    "testing",
    "ci-cd",
    "observability",
    "error-handling",
    "ai-provider-safety",
    "cost-rate-limits",
    "release-governance",
    "provenance",
    "auditability",
    "rollback",
    "organization-approval",
    "remote-attestation",
    "retention"
];
export const auditSeverities = ["low", "medium", "high", "critical"];
export function validateAuditConfig(config) {
    const errors = [];
    if (!pathUnderAudit(config.schema_dir))
        errors.push("audit.schema_dir must be under .vibecli/audit");
    if (!pathUnderAudit(config.export_dir))
        errors.push("audit.export_dir must be under .vibecli/audit");
    if (!pathUnderAudit(config.reviewer_directory_dir)) {
        errors.push("audit.reviewer_directory_dir must be under .vibecli/audit");
    }
    if (!safeToken.test(config.default_schema))
        errors.push("audit.default_schema must be a safe lowercase token");
    if (config.max_export_bytes <= 0 || config.max_export_bytes > 50_000_000) {
        errors.push("audit.max_export_bytes must be positive and bounded");
    }
    for (const format of config.allowed_export_formats) {
        if (!["json", "markdown", "csv"].includes(format)) {
            errors.push(`audit.allowed_export_formats contains unsupported format ${format}`);
        }
    }
    if (config.include_raw_logs_by_default) {
        errors.push("audit.include_raw_logs_by_default must remain false in Phase 13");
    }
    if (!config.compliance_language.avoid_certification_claims) {
        errors.push("audit.compliance_language.avoid_certification_claims must remain true in Phase 13");
    }
    if (config.retention.audit_export_retention_days <= 0) {
        errors.push("audit.retention.audit_export_retention_days must be positive");
    }
    for (const [key, value] of Object.entries(flatten(config))) {
        if (secretLike.test(String(value)))
            errors.push(`audit.${key} looks like a raw secret`);
    }
    return errors;
}
export function validateAuditSchema(schema) {
    const errors = [];
    const text = JSON.stringify(schema);
    if (secretLike.test(text))
        errors.push("audit schema contains a secret-looking value");
    if (certificationClaim.test(text))
        errors.push("audit schema must not claim certification or compliance");
    if (schema.version !== 1)
        errors.push("audit schema version must be 1");
    if (!safeToken.test(schema.name))
        errors.push("audit schema name must be a safe lowercase token");
    if (!schema.disclaimer || !/not .*certification/i.test(schema.disclaimer)) {
        errors.push("audit schema must include a disclaimer that it is not certification");
    }
    if (!Array.isArray(schema.controls) || schema.controls.length === 0) {
        errors.push("audit schema must include at least one control");
    }
    const ids = new Set();
    for (const control of schema.controls ?? []) {
        if (!safeControlId.test(control.id))
            errors.push(`audit control id is unsafe: ${control.id}`);
        if (ids.has(control.id))
            errors.push(`duplicate audit control id: ${control.id}`);
        ids.add(control.id);
        if (!auditCategories.includes(control.category)) {
            errors.push(`audit control ${control.id} has unknown category ${control.category}`);
        }
        if (!auditSeverities.includes(control.severity)) {
            errors.push(`audit control ${control.id} has unknown severity ${control.severity}`);
        }
        if (!control.checks?.length)
            errors.push(`audit control ${control.id} must include checks`);
    }
    return errors;
}
function pathUnderAudit(path) {
    return path === ".vibecli/audit" || path.startsWith(".vibecli/audit/");
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