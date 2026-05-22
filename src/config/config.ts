import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import YAML from "yaml";
import { defaultConfig, requiredSecurityPolicy } from "./defaults.js";
import { configSchema, type VibeConfig } from "./schema.js";
import { ensureDir, pathExists } from "../utils/fs.js";
import { VibeError } from "../utils/errors.js";
import { ensureDefaultPolicyProfiles } from "../policies/profile-loader.js";

export const vibeDir = ".vibecli";
export const configPath = join(vibeDir, "config.yaml");
export const securityPolicyPath = join(vibeDir, "policies", "security-policy.yaml");
export const runsPath = join(vibeDir, "runs");
const provenanceGitignoreEntries = [
  ".vibecli/keys/",
  "*.private.pem",
  ".vibecli/org/keys/",
  ".vibecli/org/**/*.private.pem",
  ".vibecli/evidence-archive/",
  ".vibecli/evidence-lifecycle/**/*.private.pem"
];

export function stringifyYaml(value: unknown): string {
  return YAML.stringify(value, { lineWidth: 0 });
}

export async function initConfig(cwd: string, force = false): Promise<void> {
  const fullConfigPath = join(cwd, configPath);
  const fullPolicyPath = join(cwd, securityPolicyPath);
  await ensureDir(join(cwd, vibeDir));
  await ensureDir(join(cwd, " .vibecli".trim(), "policies"));
  await ensureDir(join(cwd, runsPath));

  if (!pathExists(fullConfigPath) || force) {
    await writeFile(fullConfigPath, stringifyYaml(defaultConfig), "utf8");
  }
  if (!pathExists(fullPolicyPath) || force) {
    await writeFile(fullPolicyPath, stringifyYaml(requiredSecurityPolicy), "utf8");
  }
  await ensureDefaultPolicyProfiles(cwd, force);
  await ensureProvenanceGitignore(cwd);
}

async function ensureProvenanceGitignore(cwd: string): Promise<void> {
  const gitignorePath = join(cwd, ".gitignore");
  const existing = pathExists(gitignorePath) ? await readFile(gitignorePath, "utf8") : "";
  const missing = provenanceGitignoreEntries.filter(
    (entry) => !existing.split(/\r?\n/).includes(entry)
  );
  if (missing.length === 0) return;
  const prefix = existing.length > 0 && !existing.endsWith("\n") ? "\n" : "";
  await writeFile(gitignorePath, `${existing}${prefix}${missing.join("\n")}\n`, "utf8");
}

export async function loadConfig(cwd: string): Promise<VibeConfig> {
  const fullPath = join(cwd, configPath);
  if (!pathExists(fullPath)) {
    throw new VibeError(`${configPath} does not exist. Run "vibe init" first.`);
  }
  const parsed = YAML.parse(await readFile(fullPath, "utf8")) as unknown;
  return configSchema.parse(parsed);
}

export function hasConfig(cwd: string): boolean {
  return pathExists(join(cwd, configPath));
}

export async function loadConfigIfExists(cwd: string): Promise<VibeConfig | null> {
  return hasConfig(cwd) ? loadConfig(cwd) : null;
}

export async function saveConfig(cwd: string, config: VibeConfig): Promise<void> {
  const parsed = configSchema.parse(config);
  await writeFile(join(cwd, configPath), stringifyYaml(parsed), "utf8");
}

export async function loadSecurityPolicy(cwd: string): Promise<Record<string, boolean>> {
  const fullPath = join(cwd, securityPolicyPath);
  if (!pathExists(fullPath)) {
    throw new VibeError(`${securityPolicyPath} does not exist. Run "vibe init" first.`);
  }
  return YAML.parse(await readFile(fullPath, "utf8")) as Record<string, boolean>;
}
