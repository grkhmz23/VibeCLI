import type { DisposalConfig } from "./types.js";

const secretLike =
  /(sk-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9_]{12,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|bearer\s+[A-Za-z0-9._-]{16,}|[a-z]+:\/\/[^:\s/]+:[^@\s/]+@)/i;
const requiredProtected = [
  "private-keys",
  "env-files",
  "source-code",
  "archives",
  "org-keys",
  "provenance-keys",
  "git"
];

export function validateDisposalConfig(config: DisposalConfig): string[] {
  const errors: string[] = [];
  if (!underVibe(config.disposal_dir)) {
    errors.push(
      "evidence_disposal.disposal_dir must be under .vibecli/evidence-lifecycle/disposal"
    );
  }
  if (config.delete_scope !== "run-evidence-only") {
    errors.push("evidence_disposal.delete_scope must be run-evidence-only in Phase 15");
  }
  if (config.allow_archive_deletion)
    errors.push("evidence_disposal.allow_archive_deletion must remain false");
  if (config.allow_key_deletion)
    errors.push("evidence_disposal.allow_key_deletion must remain false");
  if (config.allow_source_deletion)
    errors.push("evidence_disposal.allow_source_deletion must remain false");
  if (config.allow_remote_deletion)
    errors.push("evidence_disposal.allow_remote_deletion must remain false");
  if (config.allow_automatic_purge)
    errors.push("evidence_disposal.allow_automatic_purge must remain false");
  if (!config.dry_run_by_default)
    errors.push("evidence_disposal.dry_run_by_default must remain true");
  if (config.max_files_per_disposal <= 0 || config.max_files_per_disposal > 10_000) {
    errors.push("evidence_disposal.max_files_per_disposal must be positive and bounded");
  }
  if (config.max_bytes_per_disposal <= 0 || config.max_bytes_per_disposal > 500_000_000) {
    errors.push("evidence_disposal.max_bytes_per_disposal must be positive and bounded");
  }
  for (const protectedClass of requiredProtected) {
    if (!config.protected_classes.includes(protectedClass)) {
      errors.push(`evidence_disposal.protected_classes must include ${protectedClass}`);
    }
  }
  for (const [key, value] of Object.entries(flatten(config))) {
    if (secretLike.test(String(value))) {
      errors.push(`evidence_disposal.${key} looks like a raw secret`);
    }
  }
  return errors;
}

function underVibe(path: string): boolean {
  return (
    path === ".vibecli/evidence-lifecycle/disposal" ||
    path.startsWith(".vibecli/evidence-lifecycle/disposal/")
  );
}

function flatten(value: unknown, prefix = ""): Record<string, string> {
  if (Array.isArray(value)) {
    return Object.fromEntries(
      value.flatMap((entry, index) => Object.entries(flatten(entry, `${prefix}${index}.`)))
    );
  }
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).flatMap(([key, entry]) =>
        Object.entries(flatten(entry, `${prefix}${key}.`))
      )
    );
  }
  return { [prefix.replace(/\.$/, "")]: String(value) };
}
