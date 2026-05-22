import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import YAML from "yaml";
import { ensureDir, pathExists } from "../utils/fs.js";
import { defaultPolicyProfiles, policyProfileSchema, type PolicyProfile } from "./profile.js";

export const policyProfilesDir = join(".vibecli", "policies", "profiles");

export async function ensureDefaultPolicyProfiles(cwd: string, force = false): Promise<void> {
  const dir = join(cwd, policyProfilesDir);
  await ensureDir(dir);
  for (const [name, policy] of Object.entries(defaultPolicyProfiles)) {
    const path = join(dir, `${name}.yaml`);
    if (!pathExists(path) || force) {
      await writeFile(path, YAML.stringify(policy, { lineWidth: 0 }), "utf8");
      continue;
    }
    const existing = YAML.parse(await readFile(path, "utf8")) as Partial<PolicyProfile> | null;
    if (!existing) continue;
    const upgraded = {
      ...existing,
      release: existing.release ?? policy.release,
      provenance: existing.provenance ?? policy.provenance,
      github_release: existing.github_release ?? policy.github_release,
      remote_attestation: existing.remote_attestation ?? policy.remote_attestation,
      registry_metadata: existing.registry_metadata ?? policy.registry_metadata,
      organization: existing.organization ?? policy.organization,
      audit: existing.audit ?? policy.audit,
      evidence_lifecycle: existing.evidence_lifecycle ?? policy.evidence_lifecycle,
      evidence_disposal: existing.evidence_disposal ?? policy.evidence_disposal
    };
    if (
      !existing.release ||
      !existing.provenance ||
      !existing.github_release ||
      !existing.remote_attestation ||
      !existing.registry_metadata ||
      !existing.organization ||
      !existing.audit ||
      !existing.evidence_lifecycle ||
      !existing.evidence_disposal
    ) {
      await writeFile(path, YAML.stringify(upgraded, { lineWidth: 0 }), "utf8");
    }
  }
}

export async function loadPolicyProfile(cwd: string, name: string): Promise<PolicyProfile> {
  const path = join(cwd, policyProfilesDir, `${name}.yaml`);
  if (!pathExists(path)) throw new Error(`Policy profile ${name} does not exist`);
  return policyProfileSchema.parse(YAML.parse(await readFile(path, "utf8")));
}

export async function listPolicyProfileNames(cwd: string): Promise<string[]> {
  const dir = join(cwd, policyProfilesDir);
  if (!pathExists(dir)) return [];
  return (await readdir(dir))
    .filter((entry) => entry.endsWith(".yaml"))
    .map((entry) => entry.replace(/\.yaml$/, ""))
    .sort();
}
