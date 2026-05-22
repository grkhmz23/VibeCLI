import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { initConfig, loadConfig } from "../config/config.js";
import { validateTeamConfig } from "../config/validator.js";
import { branchRun, proposedBranchName } from "../git-lifecycle/branch.js";
import { generateCommitMessage } from "../git-lifecycle/commit-message.js";
import { commitRun } from "../git-lifecycle/commit.js";
import { buildLifecycle } from "../git-lifecycle/lifecycle.js";
import { evaluateMergeReadiness } from "../git-lifecycle/merge-readiness.js";
import { validateBranchPrefix } from "../git-lifecycle/validation.js";
import { ingestLocalFeedback } from "../reviewer-feedback/local.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { executePhaseOneWorkflow } from "../orchestrator/workflow.js";
import { RunStore } from "../orchestrator/run-store.js";
import { parseConsoleCommand } from "../terminal/shortcuts.js";

const execFileAsync = promisify(execFile);

async function repo(): Promise<{ cwd: string; runId: string }> {
  const cwd = await mkdtemp(join(tmpdir(), "vibecli-phase8-"));
  await initConfig(cwd);
  await execFileAsync("git", ["init"], { cwd });
  await execFileAsync("git", ["config", "user.email", "vibe@example.test"], { cwd });
  await execFileAsync("git", ["config", "user.name", "Vibe Test"], { cwd });
  await writeFile(join(cwd, "file.txt"), "one\n");
  await writeFile(join(cwd, "package.json"), JSON.stringify({ scripts: { test: "node -v" } }));
  const config = await loadConfig(cwd);
  const state = await executePhaseOneWorkflow({
    cwd,
    prompt: "Add password reset flow OPENROUTER_API_KEY=secret-value",
    profile: "company-grade",
    config,
    runId: "run-phase8"
  });
  await writeLedgerManifest(cwd, state.runId);
  return { cwd, runId: state.runId };
}

async function markApplied(cwd: string, runId: string): Promise<void> {
  const store = new RunStore(cwd);
  const state = await store.readState(runId);
  state.apply = {
    status: "applied",
    appliedAt: new Date().toISOString(),
    filesChanged: ["file.txt"]
  };
  state.verification = {
    status: "passed",
    verifiedAt: new Date().toISOString(),
    failedCommands: []
  };
  state.scanners = {
    builtinStatus: "passed",
    externalStatus: "skipped",
    criticalFindings: 0,
    highFindings: 0
  };
  await store.writeState(state);
  await store.writeArtifact(runId, "apply-result.json", {
    runId,
    status: "applied",
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    filesChanged: ["file.txt"],
    filesCreated: [],
    filesModified: ["file.txt"],
    filesDeleted: [],
    blockedPatches: [],
    errors: []
  });
  await writeLedgerManifest(cwd, runId);
}

describe("phase 8 git lifecycle config and branch", () => {
  it("validates default lifecycle config and rejects unsafe branch prefix", async () => {
    const { cwd } = await repo();
    const config = await loadConfig(cwd);
    expect(config.git_lifecycle.protected_branches).toEqual([
      "main",
      "master",
      "production",
      "release"
    ]);
    expect((await validateTeamConfig(cwd, config)).ok).toBe(true);
    expect(() => validateBranchPrefix("../bad")).toThrow("safe path segment");
  });

  it("generates deterministic safe branch names and refuses unsafe custom names", async () => {
    const { cwd, runId } = await repo();
    const first = await proposedBranchName(cwd, runId);
    const second = await proposedBranchName(cwd, runId);
    expect(first).toBe(second);
    expect(first).toMatch(/^vibe\/\d{8}-add-password-reset-flow/);
    await expect(branchRun(cwd, runId, { name: "../bad" })).rejects.toThrow("Unsafe");
  });

  it("branch create requires confirmation and records result without pushing", async () => {
    const { cwd, runId } = await repo();
    await expect(branchRun(cwd, runId, { create: true, confirm: "wrong" })).rejects.toThrow(
      "exact confirmation"
    );
    const result = await branchRun(cwd, runId, {
      create: true,
      confirm: `CREATE BRANCH ${runId}`,
      allowDirty: true
    });
    expect(result.mode).toBe("created");
    expect(
      await readFile(join(cwd, `.vibecli/runs/${runId}/git/branch-result.json`), "utf8")
    ).toContain(result.branch);
  });
});

describe("phase 8 commit message commit lifecycle and feedback", () => {
  it("generates redacted commit messages and previews commits only by default", async () => {
    const { cwd, runId } = await repo();
    const message = await generateCommitMessage(cwd, runId);
    expect(message.subject.length).toBeLessThanOrEqual(72);
    expect(message.subject).not.toContain("secret-value");
    expect(message.body).toContain("Verification: not run.");
    const preview = await commitRun(cwd, runId);
    expect(preview.mode).toBe("preview");
    expect(preview.errors).toContain("Run has not been applied.");
    await expect(commitRun(cwd, runId, { create: true, confirm: "wrong" })).rejects.toThrow(
      "exact confirmation"
    );
  });

  it("commit create stages only applied files and writes lifecycle artifacts", async () => {
    const { cwd, runId } = await repo();
    await markApplied(cwd, runId);
    await writeFile(join(cwd, "file.txt"), "two\n");
    const result = await commitRun(cwd, runId, {
      create: true,
      confirm: `COMMIT ${runId}`,
      allowDirty: true,
      allowProtectedBranch: true
    });
    expect(result.mode).toBe("created");
    expect(result.filesStaged).toEqual(["file.txt"]);
    const lifecycle = await buildLifecycle(cwd, runId);
    expect(lifecycle.commit.status).toBe("created");
    expect(lifecycle.apply.filesChanged).toEqual(["file.txt"]);
  });

  it("feedback ingests local notes, redacts secrets, and rejects traversal", async () => {
    const { cwd, runId } = await repo();
    await writeFile(join(cwd, "review.txt"), "please change OPENROUTER_API_KEY=secret-value");
    const feedback = await ingestLocalFeedback(cwd, runId, "review.txt");
    expect(feedback.summary.changeRequests).toBe(1);
    expect(feedback.comments[0]?.body).toContain("[REDACTED]");
    await expect(ingestLocalFeedback(cwd, runId, "../outside.txt")).rejects.toThrow("repo root");
  });
});

describe("phase 8 merge readiness and console parser", () => {
  it("merge readiness never merges and reports not ready before commit", async () => {
    const { cwd, runId } = await repo();
    const result = await evaluateMergeReadiness(cwd, runId);
    expect(result.verdict).toBe("not_ready");
    expect(result.blockingReasons).toContain("No VibeCLI commit has been created.");
    expect(
      await readFile(join(cwd, `.vibecli/runs/${runId}/git/MERGE_READINESS.md`), "utf8")
    ).toContain("does not merge");
  });

  it.each([
    "/branch run-1",
    "/commit-message run-1",
    "/commit-msg run-1",
    '/commit run-1 --create --confirm "COMMIT run-1"',
    "/lifecycle run-1",
    "/feedback run-1",
    "/merge-readiness run-1",
    "/merge-check run-1",
    '/github pr run-1 --update --pr 12 --confirm "UPDATE PR run-1"'
  ])("parses %s", (input) => {
    expect(parseConsoleCommand(input).type).not.toBe("unknown");
  });
});
