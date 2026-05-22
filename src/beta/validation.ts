import { resolve } from "node:path";
import type { BetaConfig } from "./types.js";

const secretLike =
  /(sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9_]{20,}|Bearer\s+[A-Za-z0-9._-]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|[a-z]+:\/\/[^/\s:]+:[^@\s]+@|[A-Za-z0-9_=-]{40,})/i;

function underDotVibeBeta(path: string): boolean {
  const normalized = path.replaceAll("\\", "/");
  return normalized === ".vibecli/beta" || normalized.startsWith(".vibecli/beta/");
}

function scanSecrets(value: unknown, path = "beta"): string[] {
  if (typeof value === "string" && secretLike.test(value)) {
    return [`${path} looks like it contains a raw secret`];
  }
  if (Array.isArray(value))
    return value.flatMap((item, index) => scanSecrets(item, `${path}[${index}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) => scanSecrets(item, `${path}.${key}`));
  }
  return [];
}

export function validateBetaConfig(config: BetaConfig): string[] {
  const errors: string[] = [];
  for (const [name, path] of [
    ["reports_dir", config.reports_dir],
    ["trials_dir", config.trials_dir],
    ["feedback_dir", config.feedback_dir],
    ["rc_dir", config.rc_dir]
  ] as const) {
    if (!underDotVibeBeta(path)) errors.push(`beta.${name} must be under .vibecli/beta`);
    if (resolve(path) === resolve(".")) errors.push(`beta.${name} must not resolve to repo root`);
  }
  if (!config.allowed_channels.includes(config.default_channel)) {
    errors.push("beta.default_channel must be in beta.allowed_channels");
  }
  if (config.warnings.max_accepted_warnings < 0 || config.warnings.max_accepted_warnings > 50) {
    errors.push("beta.warnings.max_accepted_warnings must be bounded");
  }
  if (!config.warnings.require_acceptance_reason) {
    errors.push("beta.warnings.require_acceptance_reason must default true");
  }
  if (!config.warnings.require_reviewer_for_acceptance) {
    errors.push("beta.warnings.require_reviewer_for_acceptance must default true");
  }
  errors.push(...scanSecrets(config));
  return errors;
}
