import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pathExists, writeJson } from "../utils/fs.js";
import { runBuiltinScanners } from "../scanners/registry.js";
import { validateSourcePath } from "../tools/source-write-policy.js";
import { applyParsedFilePatch } from "../patch-engine/apply.js";
import { parseUnifiedDiff } from "../patch-engine/parser.js";
import { validateUnifiedDiff } from "../patch-engine/validator.js";
import { readPatchManifest } from "./diff.js";
import type { PatchManifest } from "./patches.js";
import { RunStore } from "./run-store.js";
import type { RunEvent } from "./state.js";

const execFileAsync = promisify(execFile);

export type ApplyResult = {
  runId: string;
  status: "applied" | "partially_applied" | "failed" | "dry_run_passed" | "dry_run_failed";
  startedAt: string;
  finishedAt: string;
  filesChanged: string[];
  filesCreated: string[];
  filesModified: string[];
  filesDeleted: string[];
  blockedPatches: Array<{ path: string; reason: string }>;
  errors: string[];
};

export type VerificationResult = {
  runId: string;
  ok: boolean;
  checks: Array<{ name: string; ok: boolean; message: string }>;
};

export type PreApplyMetadata = {
  runId: string;
  createdAt: string;
  repoRoot: string;
  gitBranch: string | null;
  gitHead: string | null;
  filesBackedUp: Array<{
    path: string;
    existed: boolean;
    backupPath: string | null;
    sha256: string | null;
  }>;
};

function now(): string {
  return new Date().toISOString();
}

async function git(args: string[], cwd: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("git", args, { cwd });
    return stdout.trim();
  } catch {
    return null;
  }
}

async function gitDiff(cwd: string): Promise<string> {
  return (await git(["diff", "--", "."], cwd)) ?? "";
}

async function hasGitChanges(cwd: string): Promise<boolean> {
  const diff = await gitDiff(cwd);
  if (diff) return true;
  return Boolean(await git(["status", "--short"], cwd));
}

async function sha256(path: string): Promise<string> {
  return createHash("sha256")
    .update(await readFile(path))
    .digest("hex");
}

async function backupFiles(args: {
  store: RunStore;
  runId: string;
  repoRoot: string;
  manifest: PatchManifest;
}): Promise<PreApplyMetadata> {
  const rollbackRoot = join(args.store.runPath(args.runId), "rollback");
  const backupRoot = join(rollbackRoot, "pre-apply-files");
  await mkdir(backupRoot, { recursive: true });
  const metadata: PreApplyMetadata = {
    runId: args.runId,
    createdAt: now(),
    repoRoot: args.repoRoot,
    gitBranch: await git(["branch", "--show-current"], args.repoRoot),
    gitHead: await git(["rev-parse", "HEAD"], args.repoRoot),
    filesBackedUp: []
  };
  for (const patch of args.manifest.patches) {
    const fullPath = join(args.repoRoot, patch.path);
    const existed = pathExists(fullPath);
    if (existed) {
      const backupPath = join("rollback", "pre-apply-files", patch.path);
      await mkdir(dirname(join(args.store.runPath(args.runId), backupPath)), { recursive: true });
      await copyFile(fullPath, join(args.store.runPath(args.runId), backupPath));
      metadata.filesBackedUp.push({
        path: patch.path,
        existed: true,
        backupPath,
        sha256: await sha256(fullPath)
      });
    } else {
      metadata.filesBackedUp.push({
        path: patch.path,
        existed: false,
        backupPath: null,
        sha256: null
      });
    }
  }
  await writeJson(join(rollbackRoot, "pre-apply-metadata.json"), metadata);
  await writeFile(join(rollbackRoot, "pre-apply.patch"), await gitDiff(args.repoRoot), "utf8");
  return metadata;
}

async function validateManifest(args: {
  store: RunStore;
  runId: string;
  repoRoot: string;
  manifest: PatchManifest;
  allowLockfiles?: boolean;
}): Promise<Array<{ path: string; reason: string }>> {
  const blocked: Array<{ path: string; reason: string }> = [];
  for (const patch of args.manifest.patches) {
    try {
      patch.path = validateSourcePath(patch.path, {
        repoRoot: args.repoRoot,
        allowLockfiles: args.allowLockfiles
      });
      const validation = await validateUnifiedDiff({
        repoRoot: args.repoRoot,
        diff: await readFile(join(args.store.runPath(args.runId), patch.artifactPath), "utf8"),
        allowLockfiles: args.allowLockfiles
      });
      const failed = validation.filter((entry) => !entry.ok);
      if (failed.length > 0) throw new Error(failed.flatMap((entry) => entry.errors).join("; "));
    } catch (error) {
      blocked.push({
        path: patch.path,
        reason: error instanceof Error ? error.message : String(error)
      });
    }
  }
  return blocked;
}

async function applyPatchFile(args: {
  repoRoot: string;
  path: string;
  operation: "create" | "modify" | "delete";
  diff: string;
}): Promise<void> {
  const parsed = parseUnifiedDiff(args.diff);
  const selected = parsed.filter((patch) => patch.path === args.path);
  if (selected.length === 0) throw new Error(`Patch artifact does not contain ${args.path}`);
  for (const patch of selected) {
    await applyParsedFilePatch(args.repoRoot, patch);
  }
}

async function verifyApply(args: {
  runId: string;
  repoRoot: string;
  manifest: PatchManifest;
  filesChanged: string[];
}): Promise<VerificationResult> {
  const checks: VerificationResult["checks"] = [];
  for (const patch of args.manifest.patches) {
    const exists = pathExists(join(args.repoRoot, patch.path));
    checks.push({
      name: `${patch.operation}:${patch.path}`,
      ok: patch.operation === "delete" ? !exists : exists,
      message: patch.operation === "delete" ? "file should be absent" : "file should exist"
    });
  }
  checks.push({
    name: "protected-config-untouched",
    ok: !args.filesChanged.some(
      (file) => file === ".vibecli/config.yaml" || file.startsWith(".vibecli/policies/")
    ),
    message: "protected VibeCLI config and policy files were not touched"
  });
  checks.push({
    name: "git-diff-exists",
    ok: args.filesChanged.length === 0 || (await hasGitChanges(args.repoRoot)),
    message: "git diff exists when files changed"
  });
  return { runId: args.runId, ok: checks.every((check) => check.ok), checks };
}

export async function applyRun(
  cwd: string,
  runId: string,
  options: {
    confirm?: string;
    dryRun?: boolean;
    allowLockfiles?: boolean;
  }
): Promise<ApplyResult> {
  const store = new RunStore(cwd);
  const state = await store.readState(runId);
  const startedAt = now();
  const emptyResult: ApplyResult = {
    runId,
    status: "failed",
    startedAt,
    finishedAt: startedAt,
    filesChanged: [],
    filesCreated: [],
    filesModified: [],
    filesDeleted: [],
    blockedPatches: [],
    errors: []
  };
  if (!options.dryRun && options.confirm !== `APPLY ${runId}`) {
    throw new Error(`Refusing to apply without exact confirmation: APPLY ${runId}`);
  }
  if (state.status === "failed" || state.status === "rejected") {
    throw new Error(`Refusing to apply run with status ${state.status}`);
  }
  if (!["approved", "approved_for_future_phase"].includes(state.approval?.status ?? "")) {
    throw new Error("Refusing to apply unapproved run");
  }
  const manifest = await readPatchManifest(store, runId);
  const blocked = await validateManifest({
    store,
    runId,
    repoRoot: cwd,
    manifest,
    allowLockfiles: options.allowLockfiles
  });
  if (blocked.length > 0) {
    const result: ApplyResult = {
      ...emptyResult,
      status: options.dryRun ? "dry_run_failed" : "failed",
      finishedAt: now(),
      blockedPatches: blocked
    };
    await store.writeArtifact(
      runId,
      options.dryRun ? "apply-dry-run-report.json" : "apply-result.json",
      result
    );
    return result;
  }
  if (options.dryRun) {
    const result: ApplyResult = {
      ...emptyResult,
      status: "dry_run_passed",
      finishedAt: now(),
      filesChanged: manifest.patches.map((patch) => patch.path),
      filesCreated: manifest.patches
        .filter((patch) => patch.operation === "create")
        .map((patch) => patch.path),
      filesModified: manifest.patches
        .filter((patch) => patch.operation === "modify")
        .map((patch) => patch.path),
      filesDeleted: manifest.patches
        .filter((patch) => patch.operation === "delete")
        .map((patch) => patch.path)
    };
    state.apply = { status: "dry_run_passed", filesChanged: result.filesChanged };
    await store.writeArtifact(runId, "apply-dry-run-report.json", result);
    await store.writeState(state);
    return result;
  }

  await backupFiles({ store, runId, repoRoot: cwd, manifest });
  const result: ApplyResult = {
    ...emptyResult,
    filesChanged: manifest.patches.map((patch) => patch.path),
    filesCreated: manifest.patches
      .filter((patch) => patch.operation === "create")
      .map((patch) => patch.path),
    filesModified: manifest.patches
      .filter((patch) => patch.operation === "modify")
      .map((patch) => patch.path),
    filesDeleted: manifest.patches
      .filter((patch) => patch.operation === "delete")
      .map((patch) => patch.path)
  };
  try {
    for (const patch of manifest.patches) {
      await applyPatchFile({
        repoRoot: cwd,
        path: patch.path,
        operation: patch.operation,
        diff: await readFile(join(store.runPath(runId), patch.artifactPath), "utf8")
      });
    }
    await writeFile(
      join(store.runPath(runId), "rollback", "post-apply.patch"),
      await gitDiff(cwd),
      "utf8"
    );
    const verification = await verifyApply({
      runId,
      repoRoot: cwd,
      manifest,
      filesChanged: result.filesChanged
    });
    const scannerResults = await runBuiltinScanners({
      repoRoot: cwd,
      filesChanged: result.filesChanged
    });
    const scannerOk = !scannerResults.some((scanner) => scanner.status === "fail");
    await store.writeArtifact(runId, "post-apply-verification.json", {
      ...verification,
      ok: verification.ok && scannerOk
    });
    await store.writeArtifact(runId, "scanner-results.json", scannerResults);
    result.status = verification.ok && scannerOk ? "applied" : "failed";
    result.finishedAt = now();
    if (result.status === "applied") {
      for (const patch of manifest.patches) patch.applied = true;
    }
    await store.writeArtifact(runId, "patches/manifest.json", manifest);
    await store.writeArtifact(runId, "apply-result.json", result);
    state.apply = {
      status: result.status === "applied" ? "applied" : "failed",
      appliedAt: now(),
      filesChanged: result.filesChanged
    };
    state.phase = 3;
    state.updatedAt = now();
    const event: RunEvent = {
      timestamp: now(),
      type: "patch_apply",
      message: `Patch apply finished with status ${result.status}`
    };
    state.events.push(event);
    await store.appendEvent(runId, event);
    await store.writeTextArtifact(
      runId,
      "APPLIED_REPORT.md",
      createAppliedReport(result, scannerResults)
    );
    await store.writeTextArtifact(
      runId,
      "final-report.md",
      createPhaseThreeReport(result, scannerResults)
    );
    await store.writeState(state);
    return result;
  } catch (error) {
    result.status = "failed";
    result.finishedAt = now();
    result.errors.push(error instanceof Error ? error.message : String(error));
    await store.writeArtifact(runId, "apply-result.json", result);
    state.apply = { status: "failed", appliedAt: now(), filesChanged: result.filesChanged };
    await store.writeState(state);
    return result;
  }
}

function createPhaseThreeReport(result: ApplyResult, scannerResults: unknown[]): string {
  const sourceModified =
    result.status === "applied"
      ? `Source files were modified by the explicit apply command: ${result.filesChanged.join(", ")}`
      : "Source files were not successfully applied by VibeCLI.";
  const nextAction =
    result.status === "applied"
      ? "Review git diff and run project test/build commands manually."
      : "Inspect apply-result and optionally run vibe rollback with confirmation.";
  return `# VibeCLI Phase 3 Run Report

Product: VibeCLI

Phase: 3

Run id: ${result.runId}

Review command availability: vibe review ${result.runId}

Patch approval status: approved

Apply status: ${result.status}

Rollback availability: vibe rollback ${result.runId} --confirm "ROLLBACK ${result.runId}"

Files changed after apply:
${result.filesChanged.map((file) => `- ${file}`).join("\n") || "- none"}

Scanner result summary:
${JSON.stringify(scannerResults, null, 2)}

Command execution summary: Commands were not executed automatically.

${sourceModified}

Next action: ${nextAction}
`;
}

function createAppliedReport(result: ApplyResult, scannerResults: unknown[]): string {
  return `# VibeCLI Applied Report

Run id: ${result.runId}

Files changed:
${result.filesChanged.map((file) => `- ${file}`).join("\n") || "- none"}

Blocked patches:
${result.blockedPatches.map((patch) => `- ${patch.path}: ${patch.reason}`).join("\n") || "- none"}

Post-apply verification: ${result.status}

Rollback command:

\`\`\`bash
vibe rollback ${result.runId} --confirm "ROLLBACK ${result.runId}"
\`\`\`

Scanner summary:
${JSON.stringify(scannerResults, null, 2)}

Project tests/build/lint were not automatically run unless command execution was explicitly invoked.
`;
}
