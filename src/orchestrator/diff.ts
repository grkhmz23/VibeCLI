import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathExists, readJson } from "../utils/fs.js";
import { validatePatchContent, validateSourcePath } from "../tools/source-write-policy.js";
import { validateUnifiedDiff } from "../patch-engine/validator.js";
import { RunStore } from "./run-store.js";
import type { PatchManifest } from "./patches.js";

export type ReviewSummary = {
  runId: string;
  runStatus: string;
  approvalStatus: string;
  patchCount: number;
  filesAffected: Array<{ path: string; operation: string; blocked: boolean; reason?: string }>;
  commands: unknown[];
  securityVerdict: string;
};

export async function readPatchManifest(store: RunStore, runId: string): Promise<PatchManifest> {
  const path = join(store.runPath(runId), "patches", "manifest.json");
  if (!pathExists(path)) throw new Error(`Patch manifest not found for run ${runId}`);
  return readJson<PatchManifest>(path);
}

export async function readPatchDiffs(store: RunStore, runId: string): Promise<string> {
  const manifest = await readPatchManifest(store, runId);
  const parts: string[] = [];
  for (const patch of manifest.patches) {
    const fullPath = join(store.runPath(runId), patch.artifactPath);
    if (!pathExists(fullPath)) continue;
    const text = await readFile(fullPath, "utf8");
    parts.push(`# ${patch.path} (${patch.operation})\n${text}`);
  }
  return parts.join("\n\n");
}

export async function reviewRun(cwd: string, runId: string): Promise<ReviewSummary> {
  const store = new RunStore(cwd);
  const state = await store.readState(runId);
  const manifest = await readPatchManifest(store, runId);
  const commandPath = join(store.runPath(runId), "command-review.json");
  const commands = pathExists(commandPath)
    ? ((await readJson<{ recommended: unknown[] }>(commandPath)).recommended ?? [])
    : [];
  const securityPath = join(store.runPath(runId), "agent-outputs", "security.json");
  const security = pathExists(securityPath)
    ? await readJson<{ verdict?: string }>(securityPath)
    : {};
  const filesAffected = await Promise.all(
    manifest.patches.map(async (patch) => {
      const diff = pathExists(join(store.runPath(runId), patch.artifactPath))
        ? await readFile(join(store.runPath(runId), patch.artifactPath), "utf8")
        : "";
      try {
        validateSourcePath(patch.path, { repoRoot: cwd });
        validatePatchContent(diff);
        return { path: patch.path, operation: patch.operation, blocked: false };
      } catch (error) {
        return {
          path: patch.path,
          operation: patch.operation,
          blocked: true,
          reason: error instanceof Error ? error.message : String(error)
        };
      }
    })
  );
  return {
    runId,
    runStatus: state.status,
    approvalStatus: state.approval?.status ?? "not_required",
    patchCount: manifest.patches.length,
    filesAffected,
    commands,
    securityVerdict: security.verdict ?? "unknown"
  };
}

export function formatReview(summary: ReviewSummary, concise = false): string {
  if (concise) {
    return `Run ${summary.runId}: ${summary.patchCount} patches, approval ${summary.approvalStatus}, security ${summary.securityVerdict}`;
  }
  const files = summary.filesAffected
    .map(
      (file) =>
        `- ${file.path} (${file.operation})${file.blocked ? ` BLOCKED: ${file.reason ?? "policy"}` : ""}`
    )
    .join("\n");
  const commands = summary.commands.map((command) => `- ${JSON.stringify(command)}`).join("\n");
  return [
    `Run id: ${summary.runId}`,
    `Run status: ${summary.runStatus}`,
    `Approval status: ${summary.approvalStatus}`,
    `Patch count: ${summary.patchCount}`,
    "Files affected:",
    files || "- none",
    "Command recommendations:",
    commands || "- none",
    `Security verdict: ${summary.securityVerdict}`
  ].join("\n");
}

export async function diffStat(
  cwd: string,
  runId: string
): Promise<Array<{ path: string; added: number; removed: number }>> {
  const store = new RunStore(cwd);
  const manifest = await readPatchManifest(store, runId);
  return Promise.all(
    manifest.patches.map(async (patch) => {
      const diff = await readFile(join(store.runPath(runId), patch.artifactPath), "utf8");
      const lines = diff.split(/\r?\n/);
      return {
        path: patch.path,
        added: lines.filter((line) => line.startsWith("+") && !line.startsWith("+++")).length,
        removed: lines.filter((line) => line.startsWith("-") && !line.startsWith("---")).length
      };
    })
  );
}

export async function checkRunDiffs(
  cwd: string,
  runId: string
): Promise<{
  runId: string;
  createdAt: string;
  ok: boolean;
  patches: Array<{
    path: string;
    ok: boolean;
    operation: string;
    additions: number;
    deletions: number;
    hunks: number;
    errors: string[];
  }>;
}> {
  const store = new RunStore(cwd);
  const manifest = await readPatchManifest(store, runId);
  const patches = (
    await Promise.all(
      manifest.patches.map(async (patch) =>
        validateUnifiedDiff({
          repoRoot: cwd,
          diff: await readFile(join(store.runPath(runId), patch.artifactPath), "utf8")
        })
      )
    )
  ).flat();
  const result = {
    runId,
    createdAt: new Date().toISOString(),
    ok: patches.every((patch) => patch.ok),
    patches
  };
  await store.writeArtifact(runId, "patch-validation.json", result);
  return result;
}
