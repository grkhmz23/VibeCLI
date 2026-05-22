const secretLike =
  /(sk-[A-Za-z0-9_-]{8,}|gh[pousr]_[A-Za-z0-9_]{8,}|Bearer\s+[A-Za-z0-9._-]{8,}|OPENROUTER_API_KEY=\S+|OPENAI_API_KEY=\S+|-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----)/gi;

export function redactDogfoodText(value: string, maxLength = 4000): string {
  const redacted = value.replace(secretLike, "[REDACTED]");
  return redacted.length > maxLength ? `${redacted.slice(0, maxLength)}...[truncated]` : redacted;
}
