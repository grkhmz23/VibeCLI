import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";
import { loadConfig } from "../config/config.js";
import { verifyLedger } from "../ledger/verify.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists, readJson } from "../utils/fs.js";
import { updateReleaseState } from "./state.js";
import { assertSafeTagName } from "./validation.js";
import type { VersionPlan } from "./types.js";

const execFileAsync = promisify(execFile);

export type TagPlan = {
  runId: string;
  createdAt: string;
  mode: "preview" | "created" | "failed";
  tag: string;
  commitSha: string | null;
  annotated: boolean;
  messagePath: string | null;
  warnings: string[];
  errors: string[];
};

async function git(args: string[], cwd: string): Promise<string | null> {
  return execFileAsync("git", args, { cwd })
    .then(({ stdout }) => stdout.trim() || null)
    .catch(() => null);
}

async function tagExists(cwd: string, tag: string): Promise<boolean> {
  return Boolean(await git(["rev-parse", "-q", "--verify", `refs/tags/${tag}`], cwd));
}

export async function tagRun(
  cwd: string,
  runId: string,
  options: {
    create?: boolean;
    deleteLocal?: boolean;
    confirm?: string;
    allowDirty?: boolean;
    allowLedgerWarning?: boolean;
    allowNoReleasePacket?: boolean;
  } = {}
): Promise<TagPlan> {
  const config = await loadConfig(cwd);
  const store = new RunStore(cwd);
  const version = await readJson<VersionPlan>(
    join(store.runPath(runId), "release", "version-plan.json")
  ).catch(() => undefined);
  const fallback = `vibe-run-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${runId.split("-").at(-1) ?? runId.slice(-6)}`;
  const tag = version?.plannedVersion
    ? `${config.release.tags.prefix}${version.plannedVersion}`
    : fallback;
  assertSafeTagName(tag);
  const result: TagPlan = {
    runId,
    createdAt: new Date().toISOString(),
    mode: "preview",
    tag,
    commitSha: await git(["rev-parse", "HEAD"], cwd),
    annotated: config.release.tags.annotated,
    messagePath: pathExists(join(store.runPath(runId), "release", "RELEASE_NOTES.md"))
      ? `release/RELEASE_NOTES.md`
      : null,
    warnings: [],
    errors: []
  };
  if (options.deleteLocal) {
    if (options.confirm !== `DELETE TAG ${runId}`) {
      throw new Error(`Local tag deletion requires exact confirmation: DELETE TAG ${runId}`);
    }
    if (await tagExists(cwd, tag)) await execFileAsync("git", ["tag", "-d", tag], { cwd });
    result.mode = "created";
    await store.writeArtifact(runId, "release/tag-plan.json", result);
    await updateReleaseState(store, runId, (release) => {
      release.tag = { status: "deleted", tag };
    });
    await writeLedgerManifest(cwd, runId);
    return result;
  }
  if (!options.create) {
    await store.writeArtifact(runId, "release/tag-plan.json", result);
    await updateReleaseState(store, runId, (release) => {
      release.tag = { status: "previewed", tag };
    });
    await writeLedgerManifest(cwd, runId);
    return result;
  }
  if (options.confirm !== `CREATE TAG ${runId}`) {
    throw new Error(`Tag creation requires exact confirmation: CREATE TAG ${runId}`);
  }
  if (
    (await git(["status", "--short"], cwd)) &&
    !options.allowDirty &&
    !config.release.tags.allow_tag_on_dirty_worktree
  ) {
    result.mode = "failed";
    result.errors.push("Dirty worktree requires --allow-dirty");
  } else if (
    !options.allowNoReleasePacket &&
    !pathExists(join(store.runPath(runId), "release", "RELEASE_SUMMARY.json"))
  ) {
    result.mode = "failed";
    result.errors.push("Release packet is required before tag creation.");
  } else if (
    !options.allowLedgerWarning &&
    !(await verifyLedger(cwd, runId).catch(() => undefined))?.ok
  ) {
    result.mode = "failed";
    result.errors.push("Ledger pass is required before tag creation.");
  } else if (await tagExists(cwd, tag)) {
    result.mode = "failed";
    result.errors.push("Tag already exists and will not be overwritten.");
  } else {
    const args =
      config.release.tags.annotated && result.messagePath
        ? ["tag", "-a", tag, "-F", join(store.runPath(runId), result.messagePath)]
        : ["tag", tag];
    await execFileAsync("git", args, { cwd });
    result.mode = "created";
  }
  await store.writeArtifact(runId, "release/tag-plan.json", result);
  await updateReleaseState(store, runId, (release) => {
    release.tag = { status: result.mode === "created" ? "created" : "failed", tag };
  });
  await writeLedgerManifest(cwd, runId);
  return result;
}
