import { execFile } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { initConfig, loadConfig } from "../config/config.js";
import { validateTeamConfig } from "../config/validator.js";
import { executePhaseOneWorkflow } from "../orchestrator/workflow.js";
import { buildReviewWorkspace } from "../orchestrator/workspace.js";
import { buildRepairPlan } from "../orchestrator/repair-planner.js";
import { listPolicyProfileNames, loadPolicyProfile } from "../policies/profile-loader.js";
import { validatePolicyProfiles } from "../policies/profile-validator.js";
import { routeAgent } from "../routing/router.js";
import { diagnoseProviders } from "../routing/diagnostics.js";
import { createProviderRegistry } from "../providers/registry.js";
import { readLedgerManifest, writeLedgerManifest } from "../ledger/manifest.js";
import { verifyLedger } from "../ledger/verify.js";
import { buildBudgetReport } from "../cost/guard.js";
import { parseConsoleCommand } from "../terminal/shortcuts.js";
import { createTheme } from "../terminal/theme.js";
import { renderHeader } from "../terminal/render.js";
import { RunStore } from "../orchestrator/run-store.js";

const execFileAsync = promisify(execFile);

async function repo(): Promise<string> {
  const cwd = await mkdtemp(join(tmpdir(), "vibecli-phase6-"));
  await initConfig(cwd);
  await execFileAsync("git", ["init"], { cwd });
  await writeFile(
    join(cwd, "package.json"),
    JSON.stringify({ scripts: { test: "node --version" } })
  );
  return cwd;
}

afterEach(() => {
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.LOCAL_KEY;
});

describe("phase 6 routing and policies", () => {
  it("routes primary and fallback providers with alias resolution", async () => {
    const cwd = await repo();
    const config = await loadConfig(cwd);
    process.env.OPENROUTER_API_KEY = "set";
    const primary = routeAgent(config, "company-grade", "implementation");
    expect(primary.selected.model).toBe("anthropic/claude-sonnet-4.5");
    expect(primary.selected.alias).toBe("strong-coder");
    delete process.env.OPENROUTER_API_KEY;
    config.providers.local = {
      type: "openai-compatible",
      base_url: "http://localhost:11434/v1",
      api_key_env: "LOCAL_KEY"
    };
    config.model_aliases.local = { provider: "local", model: "qwen2.5-coder:14b" };
    const profile = config.profiles["company-grade"];
    if (!profile) throw new Error("missing profile");
    const implementation = profile.agents.implementation;
    if (!implementation) throw new Error("missing implementation agent");
    implementation.fallback_models = [{ model_alias: "local" }];
    process.env.LOCAL_KEY = "set";
    const fallback = routeAgent(config, "company-grade", "implementation");
    expect(fallback.selected.provider).toBe("local");
    expect(fallback.fallbacks[0]?.available).toBe(true);
  });

  it("team config validation catches bad aliases and raw api keys", async () => {
    const cwd = await repo();
    const config = await loadConfig(cwd);
    const profile = config.profiles["company-grade"];
    if (!profile) throw new Error("missing profile");
    const intake = profile.agents.intake;
    if (!intake) throw new Error("missing intake agent");
    intake.model_alias = "missing";
    intake.model = undefined;
    config.providers.openrouter = {
      type: "openrouter",
      api_key_env: "sk-thislookssecret012345678901234",
      base_url: "https://openrouter.ai/api/v1"
    };
    const result = await validateTeamConfig(cwd, config);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("missing alias");
    expect(result.errors.join("\n")).toContain("actual secret");
  });

  it("policy profiles are initialized and strict-enterprise validates", async () => {
    const cwd = await repo();
    expect(await listPolicyProfileNames(cwd)).toEqual([
      "company-grade",
      "fast",
      "secure",
      "strict-enterprise"
    ]);
    expect((await loadPolicyProfile(cwd, "company-grade")).routing.strategy).toBe("balanced");
    expect((await validatePolicyProfiles(cwd)).every((result) => result.ok)).toBe(true);
  });

  it("budget report warns for unknown pricing and records override", async () => {
    const cwd = await repo();
    const config = await loadConfig(cwd);
    const report = buildBudgetReport({
      runId: "run-budget",
      config,
      overrideMaxRunCostUsd: 5,
      usage: [
        {
          agent: "intake",
          provider: "p",
          model: "m",
          promptTokens: 1,
          completionTokens: 1,
          totalTokens: 2
        }
      ]
    });
    expect(report.policy.maxRunCostUsd).toBe(5);
    expect(report.status).toBe("unknown");
  });
});

describe("phase 6 ledger and workspace", () => {
  it("creates and verifies a ledger, then detects tampering and refreshes", async () => {
    const cwd = await repo();
    const config = await loadConfig(cwd);
    const state = await executePhaseOneWorkflow({
      cwd,
      prompt: "phase6",
      profile: "company-grade",
      config,
      runId: "run-phase6"
    });
    expect((await readLedgerManifest(cwd, state.runId)).entries.length).toBeGreaterThan(0);
    expect((await verifyLedger(cwd, state.runId)).ok).toBe(true);
    await writeFile(join(cwd, ".vibecli/runs/run-phase6/state.json"), "{}");
    expect((await verifyLedger(cwd, state.runId)).ok).toBe(false);
    await writeLedgerManifest(cwd, state.runId);
    expect((await verifyLedger(cwd, state.runId)).ok).toBe(true);
  });

  it("workspace includes policy routing budget and ledger sections", async () => {
    const cwd = await repo();
    const config = await loadConfig(cwd);
    const state = await executePhaseOneWorkflow({
      cwd,
      prompt: "phase6 workspace",
      profile: "company-grade",
      config,
      policy: "company-grade",
      runId: "run-workspace"
    });
    const workspace = await buildReviewWorkspace(cwd, state.runId, true);
    expect(workspace.policy).toBe("company-grade");
    expect(workspace.routing.strategy).toBe("balanced");
    expect(workspace.ledger.entries).toBeGreaterThan(0);
  });
});

describe("phase 6 diagnostics repair and console", () => {
  it("provider diagnostics reports missing env as warning", async () => {
    const cwd = await repo();
    const config = await loadConfig(cwd);
    const diagnostics = await diagnoseProviders({
      config,
      registry: createProviderRegistry(config)
    });
    expect(diagnostics[0]?.env).toBe("missing");
    expect(diagnostics[0]?.health).toBe("warning");
  });

  it("repair plan records fixer route after failed verification", async () => {
    const cwd = await repo();
    const config = await loadConfig(cwd);
    const state = await executePhaseOneWorkflow({
      cwd,
      prompt: "repair",
      profile: "company-grade",
      config,
      runId: "run-repair"
    });
    state.verification = { status: "failed", failedCommands: ["test"] };
    await new RunStore(cwd).writeState(state);
    const plan = await buildRepairPlan({
      cwd,
      runId: state.runId,
      config,
      profile: "company-grade",
      cycle: 1
    });
    expect(plan.failureSources).toContain("verification");
    expect(plan.selectedFixer.model).toBeTruthy();
  });

  it.each([
    "/policies",
    "/policy company-grade",
    "/route --agent implementation",
    "/providers doctor",
    "/ledger run-1",
    "/ledger run-1 --verify"
  ])("parses %s", (input) => {
    expect(parseConsoleCommand(input).type).not.toBe("unknown");
  });

  it("console header includes policy and routing strategy", () => {
    const output = renderHeader(
      {
        repoPath: "/repo",
        profile: "company-grade",
        policy: "company-grade",
        routingStrategy: "balanced",
        budgetSummary: "max $15",
        configStatus: "loaded",
        providers: [],
        branch: "main"
      },
      createTheme({ color: false })
    );
    expect(output).toContain("Policy: company-grade");
    expect(output).toContain("Routing: balanced");
  });
});
