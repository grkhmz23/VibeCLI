import type { ReleaseConfig } from "./config.js";
import { validateBranchPrefix } from "../git-lifecycle/validation.js";

export function validateReleaseConfig(config: ReleaseConfig): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (config.allowed_channels.length === 0) errors.push("allowed_channels must be non-empty");
  if (config.versioning.strategy !== "semver") errors.push("versioning.strategy must be semver");
  for (const identifier of config.versioning.prerelease_identifiers) {
    if (!/^[a-z][a-z0-9-]*$/.test(identifier)) {
      errors.push(`unsafe prerelease identifier: ${identifier}`);
    }
  }
  for (const [label, value] of [
    ["release_branch.prefix", config.release_branch.prefix],
    ["tags.prefix", config.tags.prefix]
  ] as const) {
    try {
      validateBranchPrefix(value);
    } catch (error) {
      errors.push(`${label} is unsafe: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (config.deployment.execute_deploy_commands) {
    errors.push("execute_deploy_commands must remain false in Phase 9");
  }
  return { ok: errors.length === 0, errors };
}

export function assertSafeTagName(tag: string): void {
  if (!tag.trim() || tag.startsWith("-") || tag.includes("..") || tag.includes("//")) {
    throw new Error(`Unsafe tag name: ${tag}`);
  }
  if (/\s|[~^:?*[\\]/.test(tag)) throw new Error(`Unsafe tag name: ${tag}`);
  if (tag.length > 120) throw new Error("Tag name must be 120 characters or fewer");
}
