import { redactReleaseText } from "../release/redaction.js";

export function redactEvidenceText(value: string, maxLength = 20_000): string {
  return redactReleaseText(value, maxLength).replace(/sk-[A-Za-z0-9_-]{8,}/g, "[REDACTED]");
}

export function redactEvidenceJson<T>(value: T): T {
  return JSON.parse(redactEvidenceText(JSON.stringify(value))) as T;
}

export function looksSecretLike(value: string): boolean {
  return /(sk-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9_]{12,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|bearer\s+[A-Za-z0-9._-]{16,}|[a-z]+:\/\/[^:\s/]+:[^@\s/]+@|[A-Z0-9_]*(?:API_KEY|TOKEN|SECRET|PASSWORD)[A-Z0-9_]*=)/i.test(
    value
  );
}
