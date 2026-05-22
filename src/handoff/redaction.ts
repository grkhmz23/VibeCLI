import { redactSecrets } from "../tools/shell.js";

export function redactHandoffText(value: string): string {
  return redactSecrets(value)
    .replace(
      /-----BEGIN [^-]+PRIVATE KEY-----[\s\S]*?-----END [^-]+PRIVATE KEY-----/g,
      "[REDACTED_PRIVATE_KEY]"
    )
    .replace(/\b(sk-[A-Za-z0-9_-]{16,})\b/g, "[REDACTED_API_KEY]")
    .replace(/(DATABASE_URL=)[^\s]+/g, "$1[REDACTED]");
}

export function redactJson<T>(value: T): T {
  return JSON.parse(redactHandoffText(JSON.stringify(value))) as T;
}
