import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { defaultConfig } from "../config/defaults.js";
import { validateBetaConfig } from "../beta/validation.js";
import { collectBetaWarnings, acceptBetaWarning } from "../beta/warnings.js";
import { runDogfoodApplySmoke } from "../beta/dogfood-apply-smoke.js";
import { runPackageInstallCheck } from "../beta/package-install.js";
import { createBetaRcReport } from "../beta/rc-report.js";
import { createBetaTrialPack, listBetaTrials } from "../beta/trial-pack.js";
import { runDocsCheck } from "../dogfood/docs-coverage.js";
import { scannerReadiness } from "../dogfood/scanner-readiness.js";
import { previewLiveSmoke, runLiveRcSmoke } from "../dogfood/live-smoke.js";
import { parseConsoleCommand } from "../terminal/shortcuts.js";
import { writeJson } from "../utils/fs.js";

async function repo(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "vibecli-phase17-"));
  await writeJson(join(root, ".vibecli", "config.yaml"), defaultConfig);
  await writeFile(
    join(root, "README.md"),
    "dry-run live RUN LIVE RC SMOKE vibe beta-rc vibe beta-warnings vibe dogfood-apply-smoke vibe package-install-check vibe beta-trial\n",
    "utf8"
  );
  await writeFile(
    join(root, "SECURITY.md"),
    "RUN LIVE SMOKE RUN SAFE SCANNER CHECK APPLY DOGFOOD FIXTURE PATCHES CREATE PROVENANCE KEY ARCHIVE EVIDENCE DELETE EVIDENCE ACCEPT BETA WARNING RESOLVE BETA WARNING no publish no deploy\n",
    "utf8"
  );
  await writeJson(join(root, "package.json"), {
    name: "vibecli-test",
    version: "0.0.0",
    bin: { vibe: "dist/index.js" },
    files: ["dist", "README.md", "SECURITY.md"]
  });
  await writeFile(
    join(root, "dist", "index.js"),
    "#!/usr/bin/env node\nconsole.log('help')\n",
    "utf8"
  ).catch(async () => {
    await import("node:fs/promises").then((fs) =>
      fs.mkdir(join(root, "dist"), { recursive: true })
    );
    await writeFile(
      join(root, "dist", "index.js"),
      "#!/usr/bin/env node\nconsole.log('help')\n",
      "utf8"
    );
  });
  return root;
}

describe("Phase 17 beta stabilization", () => {
  it("validates default beta config and rejects secrets", () => {
    expect(validateBetaConfig(defaultConfig.beta)).toEqual([]);
    expect(validateBetaConfig({ ...defaultConfig.beta, reports_dir: "reports" })).toContain(
      "beta.reports_dir must be under .vibecli/beta"
    );
    expect(
      validateBetaConfig({
        ...defaultConfig.beta,
        default_channel: "public-beta",
        allowed_channels: ["private-beta"]
      })
    ).toContain("beta.default_channel must be in beta.allowed_channels");
    expect(
      validateBetaConfig({
        ...defaultConfig.beta,
        feedback_dir: "sk-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
      })
    ).toHaveLength(2);
  });

  it("aggregates, accepts, and resolves beta warnings with exact confirmation", async () => {
    const root = await repo();
    await writeJson(join(root, ".vibecli", "dogfood", "reports", "DOCS_CHECK.json"), {
      warnings: ["one docs warning"],
      blockers: []
    });
    const report = await collectBetaWarnings(root);
    expect(report.summary.open).toBeGreaterThan(0);
    const id = report.warnings[0]?.id ?? "";
    await expect(
      acceptBetaWarning(root, id, { by: "Reviewer", reason: "acceptable for beta" })
    ).rejects.toThrow(/exact confirmation/);
    const accepted = await acceptBetaWarning(root, id, {
      by: "Reviewer",
      reason: "acceptable for beta",
      confirm: `ACCEPT BETA WARNING ${id}`
    });
    expect(accepted.warnings.find((item) => item.id === id)?.status).toBe("accepted");
  });

  it("runs isolated dogfood apply smoke and restores source", async () => {
    const root = await repo();
    const report = await runDogfoodApplySmoke(root);
    expect(report.status).toBe("passed");
    expect(report.fixturePath).toContain(".vibecli/dogfood/fixtures");
    expect(report.checks.sourceRestored).toBe(true);
  });

  it("runs package install check without publishing", async () => {
    const root = await repo();
    const report = await runPackageInstallCheck(root);
    expect(report.checks.some((check) => check.name === "package name")).toBe(true);
    expect(report.errors.join("\n")).not.toMatch(/publish/i);
  });

  it("writes docs strict, scanner gate, trial pack, and beta rc reports", async () => {
    const root = await repo();
    await runDocsCheck(root, { strict: true });
    await scannerReadiness(root, { strict: true, installGuide: true });
    await writeJson(join(root, ".vibecli", "dogfood", "reports", "SECURITY_REDTEAM.json"), {
      summary: { criticalFailed: 0, highFailed: 0 }
    });
    await writeJson(join(root, ".vibecli", "dogfood", "reports", "PACKAGE_CHECK.json"), {
      summary: { failed: 0, warnings: 0 }
    });
    await writeJson(join(root, ".vibecli", "dogfood", "reports", "BETA_BACKLOG.json"), {
      summary: { blockingBeta: 0 }
    });
    await writeJson(join(root, ".vibecli", "dogfood", "reports", "PERF_CHECK.json"), {});
    await writeJson(join(root, ".vibecli", "beta", "reports", "DOGFOOD_APPLY_SMOKE.json"), {
      status: "passed"
    });
    await writeJson(join(root, ".vibecli", "beta", "reports", "PACKAGE_INSTALL_CHECK.json"), {
      status: "passed"
    });
    const trial = await createBetaTrialPack(root, "solo-developer");
    expect((await listBetaTrials(root))[0]?.trialId).toBe(trial.trialId);
    const rc = await createBetaRcReport(root, { strict: false });
    expect(["beta_rc_ready", "ready_with_accepted_warnings", "blocked"]).toContain(rc.verdict);
  });

  it("keeps live RC smoke exact-confirmed and parses console commands", async () => {
    const root = await repo();
    const preview = await previewLiveSmoke(root);
    expect(preview.providerCalls).toBe(false);
    await expect(runLiveRcSmoke(root, {})).rejects.toThrow(/exact confirmation/);
    expect(parseConsoleCommand("/beta-warnings").type).toBe("beta-warnings");
    expect(parseConsoleCommand("/dogfood-apply-smoke").type).toBe("dogfood-apply-smoke");
    expect(parseConsoleCommand("/package-install-check").type).toBe("package-install-check");
    expect(parseConsoleCommand("/beta-rc").type).toBe("beta-rc");
    expect(parseConsoleCommand("/beta-trial create").type).toBe("beta-trial");
  });
});
