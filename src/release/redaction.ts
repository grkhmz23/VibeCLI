const secretPatterns = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
  /\b(sk-[A-Za-z0-9_-]{12,})\b/g,
  /\b(gh[pousr]_[A-Za-z0-9_]{12,})\b/g,
  /\b([A-Za-z0-9+/=_-]{48,})\b/g,
  /\b([A-Z0-9_]*(?:API_KEY|TOKEN|SECRET|PASSWORD)[A-Z0-9_]*)=([^\s"']+)/gi,
  /\b[a-z]+:\/\/[^:\s/]+:[^@\s/]+@[^ \n]+/gi
];

export function redactReleaseText(value: string, maxLength = 20_000): string {
  let text = value;
  for (const pattern of secretPatterns) {
    text = text.replace(pattern, (match, name) =>
      typeof name === "string" && /API_KEY|TOKEN|SECRET|PASSWORD/i.test(name)
        ? `${name}=[REDACTED]`
        : "[REDACTED]"
    );
  }
  if (text.length > maxLength) {
    return `${text.slice(0, maxLength)}\n[release output truncated]`;
  }
  return text;
}

export function redactReleaseJson<T>(value: T): T {
  return JSON.parse(redactReleaseText(JSON.stringify(value))) as T;
}
