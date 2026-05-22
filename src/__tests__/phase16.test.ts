import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { initConfig, loadConfig, saveConfig } from "../config/config.js";
import { validateTeamConfig } from "../config/validator.js";
import { createBetaBacklog } from "../dogfood/backlog.js";
import { runBetaCheck } from "../dogfood/beta-readiness.js";
import { runDocsCheck } from "../dogfood/docs-coverage.js";
import { cleanDogfoodFixtures, createDogfoodFixtures } from "../dogfood/fixture-writer.js";
import { previewLiveSmoke, runLiveSmoke } from "../dogfood/live-smoke.js";
import { runPackageCheck } from "../dogfood/package-check.js";
import { runPerfCheck } from "../dogfood/performance.js";
import { runDogfood, createDogfoodPlan } from "../dogfood/runner.js";
import { scannerReadiness } from "../dogfood/scanner-readiness.js";
import { runSecurityRedteam } from "../dogfood/redteam.js";
import { readDogfoodState } from "../dogfood/config.js";
import { validateDogfoodConfig } from "../dogfood/validation.js";
import { parseConsoleCommand } from "../terminal/shortcuts.js";

const execFileAsync = promisify(execFile);

async function repo(): Promise<string> {
  const cwd = await mkdtemp(join(tmpdir(), "vibecli-phase16-"));
  await initConfig(cwd);
  await execFileAsync("git", ["init"], { cwd });
  await execFileAsync("git", ["config", "user.email", "vibe@example.test"], { cwd });
  await execFileAsync("git", ["config", "user.name", "Vibe Test"], { cwd });
  await writeFile(
    join(cwd, "package.json"),
    `${JSON.stringify({ name: "phase16", version: "0.1.0", type: "module", bin: { vibe: "./dist/index.js" } })}\n`
  );
  await writeFile(
    join(cwd, "README.md"),
    "dry-run live vibe dogfood vibe beta-check RUN LIVE SMOKE APPLY DOGFOOD FIXTURE PATCHES RUN SAFE SCANNER CHECK DELETE EVIDENCE ARCHIVE EVIDENCE CREATE PROVENANCE KEY\n"
  );
  await writeFile(join(cwd, "SECURITY.md"), "No publish. No deploy. No certification.\n");
  await execFileAsync("git", ["add", "."], { cwd });
  await execFileAsync("git", ["commit", "-m", "initial"], { cwd });
  return cwd;
}

describe("phase 16 dogfood config fixtures and runner", () => {
  it("validates defaults and rejects unsafe dogfood settings", async () => {
    const cwd = await repo();
    const config = await loadConfig(cwd);
    expect(validateDogfoodConfig(config.dogfood)).toEqual([]);
    expect((await validateTeamConfig(cwd, config)).ok).toBe(true);
    config.dogfood.allow_real_repo_patch_apply = true;
    expect(validateDogfoodConfig(config.dogfood).join(" ")).toContain(
      "allow_real_repo_patch_apply"
    );
    config.dogfood.allow_real_repo_patch_apply = false;
    config.dogfood.workspace_dir = ".";
    expect(validateDogfoodConfig(config.dogfood).join(" ")).toContain(".vibecli/dogfood");
  });

  it("creates isolated fixtures and cleans only with exact confirmation", async () => {
    const cwd = await repo();
    const fixtures = await createDogfoodFixtures(cwd);
    expect(fixtures.fixtures).toHaveLength(7);
    expect(await readFile(join(fixtures.root, "node-package", "package.json"), "utf8")).toContain(
      "typecheck"
    );
    expect(await readFile(join(fixtures.root, "vite-react", "src", "App.tsx"), "utf8")).toContain(
      "Status"
    );
    expect(
      await readFile(join(fixtures.root, "express-api", "src", "server.ts"), "utf8")
    ).toContain("CORS");
    expect(await readFile(join(fixtures.root, "nextjs-app", "app", "page.tsx"), "utf8")).toContain(
      "Next"
    );
    expect(
      await readFile(join(fixtures.root, "python-package", "pyproject.toml"), "utf8")
    ).toContain("project");
    expect(await readFile(join(fixtures.root, "rust-crate", "Cargo.toml"), "utf8")).toContain(
      "package"
    );
    expect(
      await readFile(join(fixtures.root, "solana-anchor-structural", "Anchor.toml"), "utf8")
    ).toContain("programs");
    expect(fixtures.fixtures.every((fixture) => fixture.gitInitialized)).toBe(true);
    await expect(cleanDogfoodFixtures(cwd, "wrong")).rejects.toThrow("CLEAN DOGFOOD FIXTURES");
    expect((await cleanDogfoodFixtures(cwd, "CLEAN DOGFOOD FIXTURES")).cleaned).toBe(true);
  });

  it("plans and runs one dogfood fixture without provider calls", async () => {
    const cwd = await repo();
    const plan = await createDogfoodPlan(cwd);
    expect(plan.providerCalls).toBe(false);
    const report = await runDogfood(cwd, { fixture: "node-package" });
    expect(report.summary.total).toBe(1);
    expect(report.fixtures[0]?.vibeRunId).toBeTruthy();
    expect(report.fixtures[0]?.artifacts.ledgerVerified).toBe(true);
    expect((await readDogfoodState(cwd)).latestDogfoodRunId).toBe(report.dogfoodRunId);
    await expect(
      runDogfood(cwd, { fixture: "node-package", applyFixturePatches: true, confirm: "wrong" })
    ).rejects.toThrow("APPLY DOGFOOD FIXTURE PATCHES");
  });
});

describe("phase 16 beta readiness checks", () => {
  it("previews live smoke and refuses unconfirmed live calls", async () => {
    const cwd = await repo();
    const preview = await previewLiveSmoke(cwd);
    expect(preview.providerCalls).toBe(false);
    await expect(
      runLiveSmoke(cwd, { provider: "openrouter", model: "test", confirm: "wrong" })
    ).rejects.toThrow("RUN LIVE SMOKE");
    const missing = await runLiveSmoke(cwd, {
      provider: "openrouter",
      model: "test",
      confirm: "RUN LIVE SMOKE"
    });
    expect(missing.status).toBe("failed");
    expect(JSON.stringify(missing)).not.toContain("sk-");
  });

  it("runs scanner security docs perf beta and backlog reports", async () => {
    const cwd = await repo();
    await runDogfood(cwd, { fixture: "node-package" });
    expect((await scannerReadiness(cwd)).summary.missing).toBeGreaterThanOrEqual(0);
    await expect(scannerReadiness(cwd, { runSafe: true, confirm: "wrong" })).rejects.toThrow(
      "RUN SAFE SCANNER CHECK"
    );
    const redteam = await runSecurityRedteam(cwd);
    expect(redteam.summary.criticalFailed).toBe(0);
    const pkg = await runPackageCheck(cwd);
    expect(pkg.checks.find((check) => check.name === "package name")?.status).toBe("passed");
    const docs = await runDocsCheck(cwd);
    expect(docs.blockers).toHaveLength(0);
    const perf = await runPerfCheck(cwd);
    expect(perf.checks.length).toBeGreaterThan(0);
    const beta = await runBetaCheck(cwd);
    expect(["beta_ready", "ready_with_warnings", "blocked"]).toContain(beta.verdict);
    const backlog = await createBetaBacklog(cwd);
    expect(
      backlog.items.every(
        (item) => !/deploy|publish|push|merge|delete|force/i.test(item.recommendedFix)
      )
    ).toBe(true);
  }, 20_000);

  it("parses console commands and stores beta state", async () => {
    const cwd = await repo();
    const config = await loadConfig(cwd);
    config.dogfood.external_scanners.allow_execution = true;
    await saveConfig(cwd, config);
    expect((await validateTeamConfig(cwd, await loadConfig(cwd))).ok).toBe(false);
    expect(parseConsoleCommand("/dogfood plan").type).toBe("dogfood");
    expect(parseConsoleCommand("/dogfood run").type).toBe("dogfood");
    expect(parseConsoleCommand("/dogfood report").type).toBe("dogfood");
    expect(parseConsoleCommand("/live-smoke").type).toBe("live-smoke");
    expect(parseConsoleCommand("/scanner-check").type).toBe("scanner-check");
    expect(parseConsoleCommand("/security-redteam").type).toBe("security-redteam");
    expect(parseConsoleCommand("/package-check").type).toBe("package-check");
    expect(parseConsoleCommand("/docs-check").type).toBe("docs-check");
    expect(parseConsoleCommand("/perf-check").type).toBe("perf-check");
    expect(parseConsoleCommand("/beta-check").type).toBe("beta-check");
    expect(parseConsoleCommand("/beta-backlog").type).toBe("beta-backlog");
  });
});
