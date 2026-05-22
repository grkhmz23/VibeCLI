import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { agentRoleIds } from "../agents/roles.js";
import { defaultConfig } from "../config/defaults.js";
import type { VibeConfig } from "../config/schema.js";
import { approveRun, rejectRun } from "../orchestrator/approval.js";
import { applyRun } from "../orchestrator/apply.js";
import { executeApprovedCommands, readCommandReview } from "../orchestrator/commands.js";
import { diffStat, readPatchDiffs, reviewRun } from "../orchestrator/diff.js";
import { rollbackRun } from "../orchestrator/rollback.js";
import { RunStore } from "../orchestrator/run-store.js";
import { executePhaseOneWorkflow, executePhaseTwoLiveWorkflow } from "../orchestrator/workflow.js";
import {
  envExampleScanner,
  protectedFileTouchScanner,
  secretPatternScanner
} from "../scanners/builtin.js";
import { redactSecrets } from "../tools/shell.js";

const execFileAsync = promisify(execFile);
const originalFetch = globalThis.fetch;

async function repo(): Promise<string> {
  const cwd = await mkdtemp(join(tmpdir(), "vibecli-phase3-"));
  await execFileAsync("git", ["init"], { cwd });
  await writeFile(join(cwd, "file.txt"), "one\n");
  await writeFile(join(cwd, "delete.txt"), "remove\n");
  await writeFile(join(cwd, "package.json"), JSON.stringify({ scripts: { test: "vitest" } }));
  await execFileAsync("git", ["add", "."], { cwd });
  return cwd;
}

async function runWithPatch(
  cwd: string,
  patch: {
    path: string;
    operation: "create" | "modify" | "delete";
    diff: string;
  } = {
    path: "file.txt",
    operation: "modify",
    diff: "--- a/file.txt\n+++ b/file.txt\n@@ -1 +1 @@\n-one\n+two\n"
  }
): Promise<string> {
  const runId = `run-${Math.random().toString(36).slice(2, 8)}`;
  const state = await executePhaseOneWorkflow({
    cwd,
    prompt: "phase3",
    profile: "company-grade",
    runId
  });
  state.approval = { status: "approved", approvedAt: new Date().toISOString() };
  await new RunStore(cwd).writeState(state);
  const store = new RunStore(cwd);
  await store.writeTextArtifact(runId, "patches/implementation.patch", patch.diff);
  await store.writeTextArtifact(runId, "patches/test.patch", "");
  await store.writeArtifact(runId, "patches/manifest.json", {
    runId,
    createdAt: new Date().toISOString(),
    patches: [
      {
        agent: "implementation",
        path: patch.path,
        operation: patch.operation,
        artifactPath: "patches/implementation.patch",
        rationale: "test",
        applied: false
      }
    ]
  });
  await store.writeArtifact(runId, "command-review.json", {
    recommended: [
      { agent: "test", command: "pwd", classification: "allowed", reason: "safe" },
      {
        agent: "test",
        command: "pnpm test",
        classification: "requires_approval",
        reason: "approval"
      },
      { agent: "test", command: "rm -rf .", classification: "denied", reason: "danger" }
    ]
  });
  return runId;
}

function completion(content: object): Response {
  return new Response(
    JSON.stringify({ choices: [{ message: { content: JSON.stringify(content) } }] }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
}

function liveResponses(): Response[] {
  return [
    completion({
      goal: "x",
      repo_type: "existing_repo",
      acceptance_criteria: [],
      blocking_questions: [],
      assumptions: [],
      risk_level: "low"
    }),
    completion({
      architecture_decision: "x",
      files_to_create: [],
      files_to_modify: [],
      database_changes: [],
      api_changes: [],
      security_requirements: [],
      test_plan: [],
      rollback_plan: []
    }),
    completion({ summary: "x", patches: [], commands_recommended: [], risks: [] }),
    completion({
      test_strategy: "x",
      commands_recommended: [],
      expected_failures: [],
      missing_tests: [],
      patches: []
    }),
    completion({ verdict: "pass", findings: [], security_notes: [], blocked_release_reasons: [] }),
    completion({
      verdict: "ready",
      summary: "x",
      completed_gates: [],
      blocked_gates: [],
      required_next_actions: [],
      final_user_report: "x"
    })
  ];
}

function liveConfig(): VibeConfig {
  return {
    ...defaultConfig,
    providers: {
      local: {
        type: "openai-compatible",
        base_url: "http://localhost:9999/v1",
        api_key_env: "TEST_LIVE_KEY"
      }
    },
    profiles: {
      "company-grade": {
        agents: Object.fromEntries(
          agentRoleIds.map((agent) => [
            agent,
            { provider: "local", model: "test", can_write_files: false, can_run_commands: false }
          ])
        )
      }
    }
  };
}

describe("phase 3 review and diff", () => {
  it("review reads patch manifest and summarizes patch count", async () => {
    const cwd = await repo();
    const runId = await runWithPatch(cwd);
    expect((await reviewRun(cwd, runId)).patchCount).toBe(1);
  });

  it("review diff prints proposed diffs", async () => {
    const cwd = await repo();
    const runId = await runWithPatch(cwd);
    expect(await readPatchDiffs(new RunStore(cwd), runId)).toContain("+two");
  });

  it("diff stat shows file stats without applying", async () => {
    const cwd = await repo();
    const runId = await runWithPatch(cwd);
    expect(await diffStat(cwd, runId)).toEqual([{ path: "file.txt", added: 1, removed: 1 }]);
    expect(await readFile(join(cwd, "file.txt"), "utf8")).toBe("one\n");
  });
});

describe("phase 3 apply safety", () => {
  it("apply refuses without exact confirmation string", async () => {
    const cwd = await repo();
    const runId = await runWithPatch(cwd);
    await expect(applyRun(cwd, runId, { confirm: "bad" })).rejects.toThrow("confirmation");
  });

  it("apply refuses unapproved runs", async () => {
    const cwd = await repo();
    const runId = await runWithPatch(cwd);
    const store = new RunStore(cwd);
    const state = await store.readState(runId);
    state.approval = { status: "pending" };
    await store.writeState(state);
    await expect(applyRun(cwd, runId, { confirm: `APPLY ${runId}` })).rejects.toThrow("unapproved");
  });

  it("apply treats approved_for_future_phase as approved", async () => {
    const cwd = await repo();
    const runId = await runWithPatch(cwd);
    const store = new RunStore(cwd);
    const state = await store.readState(runId);
    state.approval = { status: "approved_for_future_phase" };
    await store.writeState(state);
    expect((await applyRun(cwd, runId, { dryRun: true })).status).toBe("dry_run_passed");
  });

  it.each([
    ["/tmp/file.txt", "relative"],
    ["../file.txt", "traversal"],
    [".vibecli/config.yaml", "protected"],
    [".vibecli/policies/security-policy.yaml", "protected"],
    [".env", "protected"],
    [".env.local", "protected"],
    ["id_rsa", "protected"],
    ["key.pem", "protected"]
  ])("apply rejects blocked path %s", async (path, message) => {
    const cwd = await repo();
    const runId = await runWithPatch(cwd, { path, operation: "modify", diff: "" });
    const result = await applyRun(cwd, runId, { dryRun: true });
    expect(result.status).toBe("dry_run_failed");
    expect(result.blockedPatches[0]?.reason).toContain(message);
  });

  it("apply rejects lockfiles unless allow-lockfiles is used", async () => {
    const cwd = await repo();
    await writeFile(join(cwd, "pnpm-lock.yaml"), "a\n");
    const runId = await runWithPatch(cwd, {
      path: "pnpm-lock.yaml",
      operation: "modify",
      diff: "--- a/pnpm-lock.yaml\n+++ b/pnpm-lock.yaml\n@@ -1 +1 @@\n-a\n+b\n"
    });
    expect((await applyRun(cwd, runId, { dryRun: true })).status).toBe("dry_run_failed");
    expect((await applyRun(cwd, runId, { dryRun: true, allowLockfiles: true })).status).toBe(
      "dry_run_passed"
    );
  });

  it("apply rejects secret-looking patch content and allows safe env references", async () => {
    const cwd = await repo();
    const bad = await runWithPatch(cwd, {
      path: "safe.txt",
      operation: "create",
      diff: "+++ b/safe.txt\n@@ -0,0 +1 @@\n+OPENROUTER_API_KEY=sk-abcdefghijklmnopqrstuvwxyz123456\n"
    });
    expect((await applyRun(cwd, bad, { dryRun: true })).status).toBe("dry_run_failed");
    const safe = await runWithPatch(cwd, {
      path: "safe.txt",
      operation: "create",
      diff: "+++ b/safe.txt\n@@ -0,0 +1 @@\n+api_key_env: OPENROUTER_API_KEY\n"
    });
    expect((await applyRun(cwd, safe, { dryRun: true })).status).toBe("dry_run_passed");
  });

  it("apply dry-run validates but does not modify files", async () => {
    const cwd = await repo();
    const runId = await runWithPatch(cwd);
    expect((await applyRun(cwd, runId, { dryRun: true })).status).toBe("dry_run_passed");
    expect(await readFile(join(cwd, "file.txt"), "utf8")).toBe("one\n");
  });

  it("apply writes rollback metadata before changing files", async () => {
    const cwd = await repo();
    const runId = await runWithPatch(cwd);
    await applyRun(cwd, runId, { confirm: `APPLY ${runId}` });
    expect(
      await readFile(join(cwd, `.vibecli/runs/${runId}/rollback/pre-apply-metadata.json`), "utf8")
    ).toContain("file.txt");
  });

  it("apply creates, modifies, and deletes files", async () => {
    const cwd = await repo();
    const createRun = await runWithPatch(cwd, {
      path: "created.txt",
      operation: "create",
      diff: "+++ b/created.txt\n@@ -0,0 +1 @@\n+new\n"
    });
    await applyRun(cwd, createRun, { confirm: `APPLY ${createRun}` });
    expect(await readFile(join(cwd, "created.txt"), "utf8")).toBe("new\n");
    const modifyRun = await runWithPatch(cwd);
    await applyRun(cwd, modifyRun, { confirm: `APPLY ${modifyRun}` });
    expect(await readFile(join(cwd, "file.txt"), "utf8")).toBe("two\n");
    const deleteRun = await runWithPatch(cwd, {
      path: "delete.txt",
      operation: "delete",
      diff: "--- a/delete.txt\n+++ /dev/null\n@@ -1 +0,0 @@\n-remove\n"
    });
    await applyRun(cwd, deleteRun, { confirm: `APPLY ${deleteRun}` });
    await expect(readFile(join(cwd, "delete.txt"), "utf8")).rejects.toThrow();
  });

  it("apply updates manifest, result, verification, and avoids protected files", async () => {
    const cwd = await repo();
    const runId = await runWithPatch(cwd);
    const result = await applyRun(cwd, runId, { confirm: `APPLY ${runId}` });
    expect(result.status).toBe("applied");
    expect(await readFile(join(cwd, `.vibecli/runs/${runId}/apply-result.json`), "utf8")).toContain(
      "applied"
    );
    expect(
      await readFile(join(cwd, `.vibecli/runs/${runId}/post-apply-verification.json`), "utf8")
    ).toContain('"ok": true');
    expect(
      await readFile(join(cwd, `.vibecli/runs/${runId}/patches/manifest.json`), "utf8")
    ).toContain('"applied": true');
    expect(await readFile(join(cwd, ".vibecli/config.yaml"), "utf8").catch(() => "")).toBe("");
  });
});

describe("phase 3 rollback", () => {
  it("rollback refuses without exact confirmation string", async () => {
    const cwd = await repo();
    const runId = await runWithPatch(cwd);
    await applyRun(cwd, runId, { confirm: `APPLY ${runId}` });
    await expect(rollbackRun(cwd, runId, { confirm: "bad" })).rejects.toThrow("confirmation");
  });

  it("rollback restores modified file and records result", async () => {
    const cwd = await repo();
    const runId = await runWithPatch(cwd);
    await applyRun(cwd, runId, { confirm: `APPLY ${runId}` });
    await rollbackRun(cwd, runId, { confirm: `ROLLBACK ${runId}` });
    expect(await readFile(join(cwd, "file.txt"), "utf8")).toBe("one\n");
    expect(
      await readFile(join(cwd, `.vibecli/runs/${runId}/rollback-result.json`), "utf8")
    ).toContain("rolled_back");
  });

  it("rollback deletes newly created file", async () => {
    const cwd = await repo();
    const runId = await runWithPatch(cwd, {
      path: "created.txt",
      operation: "create",
      diff: "+++ b/created.txt\n@@ -0,0 +1 @@\n+new\n"
    });
    await applyRun(cwd, runId, { confirm: `APPLY ${runId}` });
    await rollbackRun(cwd, runId, { confirm: `ROLLBACK ${runId}` });
    await expect(readFile(join(cwd, "created.txt"), "utf8")).rejects.toThrow();
  });

  it("rollback supports dry-run without modifying files", async () => {
    const cwd = await repo();
    const runId = await runWithPatch(cwd);
    await applyRun(cwd, runId, { confirm: `APPLY ${runId}` });
    await rollbackRun(cwd, runId, { dryRun: true });
    expect(await readFile(join(cwd, "file.txt"), "utf8")).toBe("two\n");
  });
});

describe("phase 3 commands and scanners", () => {
  it("commands reads command-review.json", async () => {
    const cwd = await repo();
    const runId = await runWithPatch(cwd);
    expect((await readCommandReview(cwd, runId)).recommended).toHaveLength(3);
  });

  it("execute-approved refuses without exact confirmation", async () => {
    const cwd = await repo();
    const runId = await runWithPatch(cwd);
    await expect(executeApprovedCommands(cwd, runId, { confirm: "bad" })).rejects.toThrow(
      "confirmation"
    );
  });

  it("execute-approved executes only allowed commands and skips the rest", async () => {
    const cwd = await repo();
    const runId = await runWithPatch(cwd);
    const result = await executeApprovedCommands(cwd, runId, {
      confirm: `EXECUTE COMMANDS ${runId}`
    });
    expect(result.commands.map((command) => command.status)).toEqual([
      "success",
      "skipped",
      "skipped"
    ]);
  });

  it("command output redacts common secret values", () => {
    expect(redactSecrets("OPENROUTER_API_KEY=abcdefghijklmnopqrstuvwxyz1234567890")).toContain(
      "[REDACTED]"
    );
  });

  it("protected-file scanner catches protected file touch", async () => {
    expect(
      (await protectedFileTouchScanner({ repoRoot: "/", filesChanged: [".vibecli/config.yaml"] }))
        .status
    ).toBe("fail");
  });

  it("secret-pattern scanner catches secret-like content", async () => {
    const cwd = await repo();
    await writeFile(
      join(cwd, "secret.txt"),
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n"
    );
    expect(
      (await secretPatternScanner({ repoRoot: cwd, filesChanged: ["secret.txt"] })).status
    ).toBe("fail");
  });

  it("env-example scanner warns when env refs exist without .env.example", async () => {
    const cwd = await repo();
    await writeFile(join(cwd, "env.ts"), "process.env.OPENROUTER_API_KEY\n");
    expect((await envExampleScanner({ repoRoot: cwd, filesChanged: ["env.ts"] })).status).toBe(
      "warning"
    );
  });

  it("scanner-results.json is written after apply", async () => {
    const cwd = await repo();
    const runId = await runWithPatch(cwd);
    await applyRun(cwd, runId, { confirm: `APPLY ${runId}` });
    expect(
      await readFile(join(cwd, `.vibecli/runs/${runId}/scanner-results.json`), "utf8")
    ).toContain("protected-file-touch");
  });
});

describe("phase 3 regressions", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env.TEST_LIVE_KEY;
    vi.restoreAllMocks();
  });

  it("existing dry-run still passes", async () => {
    const cwd = await repo();
    expect(
      (
        await executePhaseOneWorkflow({
          cwd,
          prompt: "dry",
          profile: "company-grade",
          runId: "run-dry"
        })
      ).status
    ).toBe("completed");
  });

  it("existing live-mode artifact behavior remains unchanged", async () => {
    process.env.TEST_LIVE_KEY = "secret";
    const cwd = await repo();
    const responses = liveResponses();
    globalThis.fetch = vi.fn(() => Promise.resolve(responses.shift() ?? completion({})));
    const state = await executePhaseTwoLiveWorkflow({
      cwd,
      prompt: "live",
      profile: "company-grade",
      config: liveConfig(),
      runId: "run-live"
    });
    expect(state.status).toBe("completed");
    expect(
      await readFile(join(cwd, ".vibecli/runs/run-live/agent-outputs/intake.json"), "utf8")
    ).toContain('"goal"');
  });

  it("existing approve and reject behavior remains backward compatible", async () => {
    const cwd = await repo();
    const runId = await runWithPatch(cwd);
    expect(await approveRun(cwd, runId)).toContain("Approval recorded");
    await rejectRun(cwd, runId);
    expect((await new RunStore(cwd).readState(runId)).status).toBe("rejected");
  });
});
