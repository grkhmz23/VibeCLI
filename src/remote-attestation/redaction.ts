import { redactReleaseJson, redactReleaseText } from "../release/redaction.js";

export function redactAttestationText(value: string): string {
  return redactReleaseText(value);
}

export function redactAttestationJson<T>(value: T): T {
  return redactReleaseJson(value);
}
