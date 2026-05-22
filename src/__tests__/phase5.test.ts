import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { initConfig } from "../config/config.js";
import { parseUnifiedDiff } from "../patch-engine/parser.js";
import { applyParsedPatchToContent } from "../patch-engine/apply.js";
import { previewUnifiedDiff } from "../patch-engine/preview.js";
import { validateUnifiedDiff } from "../patch-engine/validator.js";
import { executePhaseOneWorkflow } from "../orchestrator/workflow.js";
import { RunStore } from "../orchestrator/run-store.js";
import { buildReviewWorkspace } from "../orchestrator/workspace.js";
import { checkRunDiffs } from "../orchestrator/diff.js";
import { verifyRun } from "../orchestrator/verify.js";
import { scanRunBuiltin, scanRunExternal } from "../orchestrator/scan.js";
import { repairRun } from "../orchestrator/repair.js";
import { estimateRunCost } from "../cost/estimate.js";
import { parseConsoleCommand } from "../terminal/shortcuts.js";
import { OpenAICompatibleProvider } from "../providers/openai-compatible.js";

const execFileAsync = promisify(execFile);
const originalFetch = globalThis.fetch;

async function repo(): Promise<string> {
  const cwd = await mkdtemp(join(tmpdir(), "vibecli-phase5-"));
  await initConfig(cwd);
  await execFileAsync("git", ["init"], { cwd });
  await writeFile(join(cwd, "file.txt"), "one\ntwo\n");
  await writeFile(
    join(cwd, "package.json"),
    JSON.stringify({
      scripts: {
        typecheck: "node --version",
        lint: "node --version",
        test: "node --version",
        build: "node --version"
      }
    })
  );
  return cwd;
}

async function runWithPatch(cwd: string): Promise<string> {
  const runId = "run-phase5";
  const state = await executePhaseOneWorkflow({
    cwd,
    prompt: "phase5",
    profile: "company-grade",
    runId
  });
  state.approval = { status: "approved" };
  await new RunStore(cwd).writeState(state);
  const store = new RunStore(cwd);
  const diff = "--- a/file.txt\n+++ b/file.txt\n@@ -1,2 +1,2 @@\n-one\n+ONE\n two\n";
  await store.writeTextArtifact(runId, "patches/implementation.patch", diff);
  await store.writeArtifact(runId, "patches/manifest.json", {
    runId,
    createdAt: new Date().toISOString(),
    patches: [
      {
        agent: "implementation",
        path: "file.txt",
        operation: "modify",
        artifactPath: "patches/implementation.patch",
        rationale: "test",
        applied: false
      }
    ]
  });
  await store.writeArtifact(runId, "command-review.json", {
    recommended: [{ agent: "test", command: "pwd", classification: "allowed", reason: "safe" }]
  });
  await store.writeArtifact(runId, "model-usage.json", {
    runId,
    entries: [
      {
        agent: "intake",
        provider: "local",
        model: "m",
        promptTokens: 1,
        completionTokens: 2,
        totalTokens: 3
      }
    ]
  });
  return runId;
}

describe("phase 5 workspace and patch engine", () => {
  it("workspace aggregates and writes review artifacts", async () => {
    const cwd = await repo();
    const runId = await runWithPatch(cwd);
    const workspace = await buildReviewWorkspace(cwd, runId, true);
    expect(workspace.patches).toHaveLength(1);
    expect(
      await readFile(join(cwd, `.vibecli/runs/${runId}/REVIEW_WORKSPACE.md`), "utf8")
    ).toContain("Review Workspace");
  });

  it("patch engine parses multi-file and multiple hunks", () => {
    const diff =
      "--- a/a.txt\n+++ b/a.txt\n@@ -1 +1 @@\n-a\n+b\n@@ -3 +3 @@\n-c\n+d\n--- a/b.txt\n+++ b/b.txt\n@@ -0,0 +1 @@\n+x\n";
    const parsed = parseUnifiedDiff(diff);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]?.hunks).toHaveLength(2);
    expect(previewUnifiedDiff(diff)).toMatchObject({ additions: 3, deletions: 2, hunks: 3 });
  });

  it("patch engine applies create, modify, delete content and rejects bad input", async () => {
    const modify = parseUnifiedDiff("--- a/file.txt\n+++ b/file.txt\n@@ -1 +1 @@\n-one\n+two\n")[0];
    expect(modify ? applyParsedPatchToContent("one\n", modify) : "").toBe("two\n");
    expect(() => parseUnifiedDiff("GIT binary patch\nabc")).toThrow("Binary");
    expect(() => parseUnifiedDiff("--- a/a\n+++ b/a\n@@ bad @@\n")).toThrow("Malformed hunk");
    const cwd = await repo();
    expect(
      (
        await validateUnifiedDiff({
          repoRoot: cwd,
          diff: "--- a/file.txt\n+++ b/file.txt\n@@ -1 +1 @@\n-missing\n+x\n"
        })
      )[0]?.ok
    ).toBe(false);
    expect(
      (
        await validateUnifiedDiff({
          repoRoot: cwd,
          diff: "--- a/../x\n+++ b/../x\n@@ -0,0 +1 @@\n+x\n"
        })
      )[0]?.ok
    ).toBe(false);
  });

  it("diff check writes patch-validation.json", async () => {
    const cwd = await repo();
    const runId = await runWithPatch(cwd);
    expect((await checkRunDiffs(cwd, runId)).ok).toBe(true);
    expect(
      await readFile(join(cwd, `.vibecli/runs/${runId}/patch-validation.json`), "utf8")
    ).toContain("file.txt");
  });
});

describe("phase 5 streaming, verify, scan, repair, cost", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env.TEST_STREAM_KEY;
    vi.restoreAllMocks();
  });

  it("OpenAI-compatible stream handles delta and final content", async () => {
    process.env.TEST_STREAM_KEY = "secret";
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(
          'data: {"choices":[{"delta":{"content":"{\\"goal\\""}}]}\n\ndata: {"choices":[{"delta":{"content":":1}"}}]}\n\ndata: [DONE]\n',
          {
            status: 200
          }
        )
      )
    );
    const events = [];
    for await (const event of new OpenAICompatibleProvider(
      "local",
      "http://localhost",
      "TEST_STREAM_KEY"
    ).streamAgent({
      providerName: "local",
      model: "m",
      agentRole: "intake",
      messages: []
    })) {
      events.push(event);
    }
    expect(events.at(-1)).toEqual({ type: "end", content: '{"goal":1}' });
  });

  it("verify writes results and updates state", async () => {
    const cwd = await repo();
    const runId = await runWithPatch(cwd);
    const result = await verifyRun(cwd, runId, {
      confirm: `VERIFY ${runId}`,
      names: ["typecheck"],
      timeoutMs: 5000
    });
    expect(result.status).toBe("passed");
    expect((await new RunStore(cwd).readState(runId)).verification?.status).toBe("passed");
  });

  it("scan default writes built-in results and external missing scanners skip", async () => {
    const cwd = await repo();
    const runId = await runWithPatch(cwd);
    expect(await scanRunBuiltin(cwd, runId)).toBeTruthy();
    await expect(scanRunExternal(cwd, runId)).rejects.toThrow("SCAN");
    expect((await scanRunExternal(cwd, runId, `SCAN ${runId}`)).status).toBe("skipped");
  });

  it("repair dry-run does not call provider and not required when no failed gate exists", async () => {
    const cwd = await repo();
    const runId = await runWithPatch(cwd);
    const result = await repairRun(cwd, runId, { dryRun: true });
    expect(result.status).toBe("not_required");
  });

  it("cost estimate marks unknown pricing", async () => {
    const cwd = await repo();
    const runId = await runWithPatch(cwd);
    const estimate = await estimateRunCost(cwd, runId);
    expect(estimate.known).toBe(false);
    expect(estimate.entries[0]?.totalTokens).toBe(3);
  });
});

describe("phase 5 console parser", () => {
  it.each([
    "/workspace run-1",
    "/verify run-1",
    "/scan run-1",
    "/repair run-1 --dry-run",
    "/cost run-1",
    "/stream on",
    "/stream off"
  ])("parses %s", (input) => {
    expect(parseConsoleCommand(input).type).not.toBe("unknown");
  });
});
