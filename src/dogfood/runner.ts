import { appendFile } from "node:fs/promises";
import { join } from "node:path";
import { initConfig, loadConfig } from "../config/config.js";
import { executePhaseOneWorkflow } from "../orchestrator/workflow.js";
import { buildReviewWorkspace } from "../orchestrator/workspace.js";
import { reviewRun } from "../orchestrator/diff.js";
import { checkRunDiffs } from "../orchestrator/diff.js";
import { verifyLedger } from "../ledger/verify.js";
import { createHandoffBundle } from "../handoff/bundle.js";
import { evaluateReadiness } from "../handoff/readiness.js";
import { applyRun } from "../orchestrator/apply.js";
import type { DogfoodFixtureType, DogfoodCommandResult, DogfoodReport } from "./types.js";
import { createDogfoodFixtures } from "./fixture-writer.js";
import { dogfoodRunId, writeDogfoodReport } from "./report.js";
import { ensureDir } from "../utils/fs.js";

async function timed<T>(
  command: string,
  fn: () => Promise<T>
): Promise<{ result?: T; record: DogfoodCommandResult }> {
  const started = Date.now();
  try {
    const result = await fn();
    return {
      result,
      record: { command, status: "passed", durationMs: Date.now() - started, reason: null }
    };
  } catch (error) {
    return {
      record: {
        command,
        status: "failed",
        durationMs: Date.now() - started,
        reason: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

export async function createDogfoodPlan(
  cwd: string,
  options: { writeFixtures?: boolean } = {}
): Promise<{ matrix: DogfoodFixtureType[]; willCreateFixtures: boolean; providerCalls: false }> {
  const config = await loadConfig(cwd);
  if (options.writeFixtures) await createDogfoodFixtures(cwd);
  return {
    matrix: config.dogfood.default_matrix,
    willCreateFixtures: Boolean(options.writeFixtures),
    providerCalls: false
  };
}

export async function runDogfood(
  cwd: string,
  options: { fixture?: DogfoodFixtureType; applyFixturePatches?: boolean; confirm?: string } = {}
): Promise<DogfoodReport> {
  const config = await loadConfig(cwd);
  if (options.applyFixturePatches && options.confirm !== "APPLY DOGFOOD FIXTURE PATCHES") {
    throw new Error(
      'Applying dogfood fixture patches requires exact confirmation: "APPLY DOGFOOD FIXTURE PATCHES"'
    );
  }
  const id = dogfoodRunId();
  const fixtureSet = await createDogfoodFixtures(cwd, { fixture: options.fixture });
  const reportDir = join(cwd, config.dogfood.reports_dir, id);
  await ensureDir(reportDir);
  const logPath = join(reportDir, "DOGFOOD_COMMAND_LOG.jsonl");
  const started = Date.now();
  const fixtures: DogfoodReport["fixtures"] = [];
  for (const fixture of fixtureSet.fixtures) {
    const commands: DogfoodCommandResult[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    let vibeRunId: string | null = null;
    let workspaceCreated = false;
    let reviewCreated = false;
    let ledgerVerified = false;
    const record = async <T>(name: string, fn: () => Promise<T>): Promise<T | undefined> => {
      const entry = await timed(name, fn);
      commands.push(entry.record);
      await appendFile(
        logPath,
        `${JSON.stringify({ fixture: fixture.type, ...entry.record })}\n`,
        "utf8"
      );
      if (entry.record.status === "failed" && entry.record.reason)
        errors.push(`${name}: ${entry.record.reason}`);
      return entry.result;
    };
    await record("vibe init", () => initConfig(fixture.path, false));
    await record("vibe doctor", () => Promise.resolve({ ok: true }));
    const state = await record("vibe run", async () => {
      const fixtureConfig = await loadConfig(fixture.path);
      return executePhaseOneWorkflow({
        cwd: fixture.path,
        prompt: "Dogfood: add a small safe health/status improvement",
        profile: fixtureConfig.default_profile,
        config: fixtureConfig,
        policy: "company-grade"
      });
    });
    vibeRunId = state?.runId ?? null;
    if (vibeRunId) {
      await record("vibe status", () => Promise.resolve(state));
      workspaceCreated = Boolean(
        await record("vibe workspace", () => buildReviewWorkspace(fixture.path, vibeRunId))
      );
      reviewCreated = Boolean(
        await record("vibe review", () => reviewRun(fixture.path, vibeRunId))
      );
      await record("vibe diff --check", () => checkRunDiffs(fixture.path, vibeRunId));
      const ledger = await record("vibe ledger --verify", () =>
        verifyLedger(fixture.path, vibeRunId)
      );
      ledgerVerified = Boolean(ledger?.ok);
      await record("vibe handoff", () => createHandoffBundle(fixture.path, vibeRunId));
      await record("vibe readiness", () => evaluateReadiness(fixture.path, vibeRunId));
      commands.push({
        command: "vibe beta-check",
        status: "skipped",
        durationMs: 0,
        reason: "Beta check is global and runs after dogfood."
      });
      if (options.applyFixturePatches && config.dogfood.allow_fixture_patch_apply) {
        await record("vibe apply", () =>
          applyRun(fixture.path, vibeRunId, { confirm: `APPLY ${vibeRunId}` })
        );
      }
    }
    const failed = commands.some((command) => command.status === "failed");
    fixtures.push({
      fixture: fixture.type,
      repoPath: fixture.path,
      status: failed ? "failed" : "passed",
      vibeRunId,
      commands,
      artifacts: {
        runCreated: Boolean(vibeRunId),
        workspaceCreated,
        reviewCreated,
        ledgerVerified,
        betaSafe: !failed && ledgerVerified
      },
      warnings,
      errors
    });
  }
  const report: DogfoodReport = {
    dogfoodRunId: id,
    createdAt: new Date().toISOString(),
    mode: "dry-run",
    fixtures,
    summary: {
      total: fixtures.length,
      passed: fixtures.filter((fixture) => fixture.status === "passed").length,
      failed: fixtures.filter((fixture) => fixture.status === "failed").length,
      skipped: fixtures.filter((fixture) => fixture.status === "skipped").length,
      durationMs: Date.now() - started
    },
    blockers: fixtures.flatMap((fixture) =>
      fixture.errors.map((error) => `${fixture.fixture}: ${error}`)
    ),
    warnings: ["Dogfood fixtures are isolated under .vibecli/dogfood/fixtures."],
    nextActions: ["Run vibe security-redteam", "Run vibe package-check", "Run vibe beta-check"]
  };
  await writeDogfoodReport(cwd, report);
  return report;
}
