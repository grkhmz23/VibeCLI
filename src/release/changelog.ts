import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { loadConfig } from "../config/config.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists, readJson } from "../utils/fs.js";
import { redactReleaseText } from "./redaction.js";
import { updateReleaseState } from "./state.js";
import type { ChangelogEntry, VersionPlan } from "./types.js";

function dateOnly(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function generateChangelogEntry(cwd: string, runId: string): Promise<ChangelogEntry> {
  const store = new RunStore(cwd);
  const state = await store.readState(runId);
  const version = await readJson<VersionPlan>(
    join(store.runPath(runId), "release", "version-plan.json")
  )
    .then((plan) => plan.plannedVersion)
    .catch(() => null);
  const appliedFiles = state.apply.filesChanged;
  const lower = state.prompt.toLowerCase();
  const entry: ChangelogEntry = {
    runId,
    createdAt: new Date().toISOString(),
    style: "keepachangelog",
    version,
    date: dateOnly(),
    sections: {
      added: [],
      changed: [],
      fixed: [],
      security: [],
      deprecated: [],
      removed: []
    },
    warnings: []
  };
  const summary = redactReleaseText(state.prompt);
  if (state.apply.status !== "applied")
    entry.warnings.push("Source has not been applied; entry is proposed only.");
  if (state.verification?.status !== "passed")
    entry.warnings.push("Verification was not run or did not pass.");
  if (state.scanners?.builtinStatus === "not_started")
    entry.warnings.push("Scanner status was not run.");
  if (/security|auth|token|secret/.test(lower)) entry.sections.security.push(summary);
  else if (/fix|bug/.test(lower)) entry.sections.fixed.push(summary);
  else if (/add|feature|new/.test(lower)) entry.sections.added.push(summary);
  else entry.sections.changed.push(summary);
  if (appliedFiles.length) entry.sections.changed.push(`Updated ${appliedFiles.join(", ")}.`);
  await store.writeArtifact(runId, "release/changelog-entry.json", entry);
  await store.writeTextArtifact(runId, "release/CHANGELOG_ENTRY.md", renderChangelogEntry(entry));
  await updateReleaseState(store, runId, (release) => {
    release.changelog = { status: "previewed", path: "release/CHANGELOG_ENTRY.md" };
  });
  await writeLedgerManifest(cwd, runId);
  return entry;
}

export function renderChangelogEntry(entry: ChangelogEntry): string {
  const title = `## [${entry.version ?? "Unreleased"}] - ${entry.date}`;
  const section = (name: string, values: string[]) =>
    values.length ? `\n### ${name}\n${values.map((value) => `- ${value}`).join("\n")}\n` : "";
  return `${title}
${entry.warnings.length ? `\n> ${entry.warnings.join(" ")}\n` : ""}
${section("Added", entry.sections.added)}${section("Changed", entry.sections.changed)}${section("Fixed", entry.sections.fixed)}${section("Security", entry.sections.security)}${section("Deprecated", entry.sections.deprecated)}${section("Removed", entry.sections.removed)}`;
}

export async function writeChangelog(
  cwd: string,
  runId: string,
  options: { confirm?: string }
): Promise<{ runId: string; path: string; status: "written"; rollbackPath: string }> {
  if (options.confirm !== `WRITE CHANGELOG ${runId}`) {
    throw new Error(`Changelog write requires exact confirmation: WRITE CHANGELOG ${runId}`);
  }
  const config = await loadConfig(cwd);
  const store = new RunStore(cwd);
  const entry = await readJson<ChangelogEntry>(
    join(store.runPath(runId), "release", "changelog-entry.json")
  ).catch(() => generateChangelogEntry(cwd, runId));
  const changelogPath = join(cwd, config.release.changelog.file);
  const rollbackPath = "release/changelog-rollback";
  const backup = join(store.runPath(runId), rollbackPath, config.release.changelog.file);
  await mkdir(dirname(backup), { recursive: true });
  if (pathExists(changelogPath)) await copyFile(changelogPath, backup);
  const existing = pathExists(changelogPath)
    ? await readFile(changelogPath, "utf8")
    : "# Changelog\n\n";
  const insertion = `${renderChangelogEntry(entry).trim()}\n\n`;
  const next = existing.startsWith("# Changelog")
    ? existing.replace(/^# Changelog\s*/m, `# Changelog\n\n${insertion}`)
    : `# Changelog\n\n${insertion}${existing}`;
  await writeFile(changelogPath, next, "utf8");
  await store.writeArtifact(runId, "release/changelog-write-result.json", {
    runId,
    path: config.release.changelog.file,
    status: "written",
    rollbackPath
  });
  await updateReleaseState(store, runId, (release) => {
    release.changelog = { status: "written", path: config.release.changelog.file };
  });
  await writeLedgerManifest(cwd, runId);
  return { runId, path: config.release.changelog.file, status: "written", rollbackPath };
}
