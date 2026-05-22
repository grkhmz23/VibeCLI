import { redactReleaseText } from "../release/redaction.js";
export function redactEvidenceText(value, maxLength = 20_000) {
    return redactReleaseText(value, maxLength).replace(/sk-[A-Za-z0-9_-]{8,}/g, "[REDACTED]");
}
export function redactEvidenceJson(value) {
    return JSON.parse(redactEvidenceText(JSON.stringify(value)));
}
export function looksSecretLike(value) {
    return /(sk-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9_]{12,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|bearer\s+[A-Za-z0-9._-]{16,}|[a-z]+:\/\/[^:\s/]+:[^@\s/]+@|[A-Z0-9_]*(?:API_KEY|TOKEN|SECRET|PASSWORD)[A-Z0-9_]*=)/i.test(value);
}
//# sourceMappingURL=redaction.js.map