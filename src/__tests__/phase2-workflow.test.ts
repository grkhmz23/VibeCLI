import { readFile } from "node:fs/promises";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultConfig } from "../config/defaults.js";
import type { VibeConfig } from "../config/schema.js";
import { agentRoleIds } from "../agents/roles.js";
import { approveRun, rejectRun } from "../orchestrator/approval.js";
import { executePhaseOneWorkflow, executePhaseTwoLiveWorkflow } from "../orchestrator/workflow.js";

const originalFetch = globalThis.fetch;

function completion(content: object): Response {
  return new Response(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify(content) } }],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

function liveResponses(): Response[] {
  return [
    completion({
      goal: "Add feature",
      repo_type: "existing_repo",
      acceptance_criteria: ["Works"],
      blocking_questions: [],
      assumptions: [],
      risk_level: "low"
    }),
    completion({
      architecture_decision: "Small change",
      files_to_create: [],
      files_to_modify: ["src/example.ts"],
      database_changes: [],
      api_changes: [],
      security_requirements: [],
      test_plan: ["unit"],
      rollback_plan: ["revert patch"]
    }),
    completion({
      summary: "Proposed implementation",
      patches: [
        {
          path: "src/example.ts",
          operation: "modify",
          unified_diff:
            "--- a/src/example.ts\n+++ b/src/example.ts\n@@\n-export const x = 1;\n+export const x = 2;",
          rationale: "requested change"
        }
      ],
      commands_recommended: ["pnpm test"],
      risks: []
    }),
    completion({
      test_strategy: "Run unit tests",
      commands_recommended: ["pnpm test"],
      expected_failures: [],
      missing_tests: [],
      patches: []
    }),
    completion({
      verdict: "pass",
      findings: [],
      security_notes: [],
      blocked_release_reasons: []
    }),
    completion({
      verdict: "ready",
      summary: "Ready after approval",
      completed_gates: ["intake", "repo_scanner"],
      blocked_gates: [],
      required_next_actions: ["Review patch"],
      final_user_report: "Review proposed patch."
    })
  ];
}

async function tempRepo(): Promise<string> {
  const cwd = await mkdtemp(join(tmpdir(), "vibecli-live-"));
  await writeFile(join(cwd, "package.json"), JSON.stringify({ scripts: { test: "vitest" } }));
  await writeFile(join(cwd, "src.ts"), "export const x = 1;");
  return cwd;
}

function config(): VibeConfig {
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
            {
              provider: "local",
              model: "test-model",
              can_write_files: false,
              can_run_commands: false
            }
          ])
        )
      }
    }
  };
}

describe("phase 2 workflow", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env.TEST_LIVE_KEY;
    vi.restoreAllMocks();
  });

  it("dry-run remains deterministic and does not call providers", async () => {
    const cwd = await tempRepo();
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;
    const state = await executePhaseOneWorkflow({
      cwd,
      prompt: "Dry run",
      profile: "company-grade",
      runId: "run-dry"
    });
    expect(state.status).toBe("completed");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("live run calls provider execution and creates agent output artifacts", async () => {
    process.env.TEST_LIVE_KEY = "secret";
    const cwd = await tempRepo();
    const responses = liveResponses();
    const fetchMock = vi.fn(() => Promise.resolve(responses.shift() ?? completion({})));
    globalThis.fetch = fetchMock;
    const state = await executePhaseTwoLiveWorkflow({
      cwd,
      prompt: "Live run",
      profile: "company-grade",
      config: config(),
      runId: "run-live"
    });
    expect(fetchMock).toHaveBeenCalledTimes(6);
    expect(state.status).toBe("completed_with_pending_approval");
    expect(
      await readFile(join(cwd, ".vibecli/runs/run-live/agent-outputs/intake.json"), "utf8")
    ).toContain("Add feature");
  });

  it("live run with patch proposals ends with pending approval", async () => {
    process.env.TEST_LIVE_KEY = "secret";
    const cwd = await tempRepo();
    const responses = liveResponses();
    globalThis.fetch = vi.fn(() => Promise.resolve(responses.shift() ?? completion({})));
    const state = await executePhaseTwoLiveWorkflow({
      cwd,
      prompt: "Live run",
      profile: "company-grade",
      config: config(),
      runId: "run-pending"
    });
    expect(state.approval.status).toBe("pending");
  });

  it("approve records approval intent only and does not apply patches", async () => {
    process.env.TEST_LIVE_KEY = "secret";
    const cwd = await tempRepo();
    const responses = liveResponses();
    globalThis.fetch = vi.fn(() => Promise.resolve(responses.shift() ?? completion({})));
    await executePhaseTwoLiveWorkflow({
      cwd,
      prompt: "Live run",
      profile: "company-grade",
      config: config(),
      runId: "run-approve"
    });
    const output = await approveRun(cwd, "run-approve");
    expect(output).toContain("Patch application is intentionally disabled");
    expect(await readFile(join(cwd, "src.ts"), "utf8")).toBe("export const x = 1;");
  });

  it("reject marks run rejected", async () => {
    const cwd = await tempRepo();
    await executePhaseOneWorkflow({
      cwd,
      prompt: "Dry run",
      profile: "company-grade",
      runId: "run-reject"
    });
    await rejectRun(cwd, "run-reject");
    const state = JSON.parse(
      await readFile(join(cwd, ".vibecli/runs/run-reject/state.json"), "utf8")
    ) as {
      status: string;
      approval: { status: string };
    };
    expect(state.status).toBe("rejected");
    expect(state.approval.status).toBe("rejected");
  });
});
