import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists, readJson } from "../utils/fs.js";
import { updateReleaseState } from "./state.js";
import type { VersionPlan } from "./types.js";

export type VersionApplyResult = {
  runId: string;
  status: "applied" | "failed";
  filesChanged: string[];
  rollbackPath: string;
  errors: string[];
};

function replaceVersion(content: string, path: string, current: string, planned: string): string {
  if (path === "package.json") {
    const value = JSON.parse(content) as Record<string, unknown>;
    value.version = planned;
    return `${JSON.stringify(value, null, 2)}\n`;
  }
  const next = content.replace(
    new RegExp(`(^\\s*version\\s*=\\s*")${current.replaceAll(".", "\\.")}(")`, "m"),
    `$1${planned}$2`
  );
  if (next === content) throw new Error(`Could not replace version in ${path}`);
  return next;
}

export async function applyVersionPlan(
  cwd: string,
  runId: string,
  options: { confirm?: string }
): Promise<VersionApplyResult> {
  if (options.confirm !== `APPLY VERSION ${runId}`) {
    throw new Error(`Version apply requires exact confirmation: APPLY VERSION ${runId}`);
  }
  const store = new RunStore(cwd);
  const plan = await readJson<VersionPlan>(
    join(store.runPath(runId), "release", "version-plan.json")
  );
  const rollbackPath = "release/version-rollback";
  const result: VersionApplyResult = {
    runId,
    status: "failed",
    filesChanged: [],
    rollbackPath,
    errors: []
  };
  try {
    for (const file of plan.files) {
      if (/lock/i.test(file.path))
        throw new Error(`Lockfile modification is blocked: ${file.path}`);
      const fullPath = join(cwd, file.path);
      if (!pathExists(fullPath)) throw new Error(`Version file is missing: ${file.path}`);
      const backup = join(store.runPath(runId), rollbackPath, file.path);
      await mkdir(dirname(backup), { recursive: true });
      await copyFile(fullPath, backup);
      await writeFile(
        fullPath,
        replaceVersion(
          await readFile(fullPath, "utf8"),
          file.path,
          file.currentVersion,
          file.plannedVersion
        ),
        "utf8"
      );
      result.filesChanged.push(file.path);
    }
    result.status = "applied";
    await store.writeArtifact(runId, "release/version-apply-result.json", result);
    await updateReleaseState(store, runId, (release) => {
      release.version = {
        status: "applied",
        currentVersion: plan.currentVersion ?? undefined,
        plannedVersion: plan.plannedVersion ?? undefined
      };
    });
    await writeLedgerManifest(cwd, runId);
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
    await store.writeArtifact(runId, "release/version-apply-result.json", result);
    await updateReleaseState(store, runId, (release) => {
      release.version.status = "failed";
    });
  }
  return result;
}
