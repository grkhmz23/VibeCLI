import { resolve } from "node:path";
import type { DogfoodConfig } from "./types.js";
import { dogfoodFixtureTypes } from "./types.js";

const secretLike =
  /(sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9_]{20,}|Bearer\s+[A-Za-z0-9._-]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|[a-z]+:\/\/[^/\s:]+:[^@\s]+@|[A-Za-z0-9_=-]{40,})/i;

function underDotVibeDogfood(path: string): boolean {
  const normalized = path.replaceAll("\\", "/");
  return normalized === ".vibecli/dogfood" || normalized.startsWith(".vibecli/dogfood/");
}

function scanSecrets(value: unknown, path = "dogfood"): string[] {
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

export function validateDogfoodConfig(config: DogfoodConfig): string[] {
  const errors: string[] = [];
  for (const [name, path] of [
    ["workspace_dir", config.workspace_dir],
    ["fixtures_dir", config.fixtures_dir],
    ["reports_dir", config.reports_dir]
  ] as const) {
    if (!underDotVibeDogfood(path)) errors.push(`dogfood.${name} must be under .vibecli/dogfood`);
    if (resolve(path) === resolve("."))
      errors.push(`dogfood.${name} must not resolve to repo root`);
  }
  for (const fixture of config.default_matrix) {
    if (!(dogfoodFixtureTypes as readonly string[]).includes(fixture)) {
      errors.push(`dogfood.default_matrix contains unknown fixture ${fixture}`);
    }
  }
  if (config.allow_live_provider_smoke) {
    errors.push(
      "dogfood.allow_live_provider_smoke must default false unless explicitly changed for local use"
    );
  }
  if (config.allow_real_repo_patch_apply) {
    errors.push("dogfood.allow_real_repo_patch_apply must remain false by default");
  }
  if (config.external_scanners.allow_execution) {
    errors.push("dogfood.external_scanners.allow_execution must remain false by default");
  }
  if (config.max_fixture_runtime_ms <= 0 || config.max_fixture_runtime_ms > 600_000) {
    errors.push("dogfood.max_fixture_runtime_ms must be positive and bounded");
  }
  if (config.max_total_runtime_ms <= 0 || config.max_total_runtime_ms > 3_600_000) {
    errors.push("dogfood.max_total_runtime_ms must be positive and bounded");
  }
  if (config.max_report_bytes <= 0 || config.max_report_bytes > 100_000_000) {
    errors.push("dogfood.max_report_bytes must be positive and bounded");
  }
  errors.push(...scanSecrets(config));
  return errors;
}
