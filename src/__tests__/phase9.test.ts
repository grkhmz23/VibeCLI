import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { initConfig, loadConfig } from "../config/config.js";
import { validateTeamConfig } from "../config/validator.js";
import { addReleaseApproval } from "../release/approval.js";
import { generateChangelogEntry, writeChangelog } from "../release/changelog.js";
import { ingestCiFile, showOrCreateLocalCiStatus } from "../release/ci.js";
import { evaluateDeploymentReadiness } from "../release/deployment-readiness.js";
import { verifyReleaseIntegrity } from "../release/integrity.js";
import { generateReleasePacket } from "../release/packet.js";
import { releaseBranchRun } from "../release/release-branch.js";
import { evaluateReleaseReadiness } from "../release/release-readiness.js";
import { tagRun } from "../release/tag.js";
import { applyVersionPlan } from "../release/version-apply.js";
import { planVersion } from "../release/version.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { executePhaseOneWorkflow } from "../orchestrator/workflow.js";
import { RunStore } from "../orchestrator/run-store.js";
import { parseConsoleCommand } from "../terminal/shortcuts.js";

const execFileAsync = promisify(execFile);

async function repo(): Promise<{ cwd: string; runId: string }> {
  const cwd = await mkdtemp(join(tmpdir(), "vibecli-phase9-"));
  await initConfig(cwd);
  await execFileAsync("git", ["init"], { cwd });
  await execFileAsync("git", ["config", "user.email", "vibe@example.test"], { cwd });
  await execFileAsync("git", ["config", "user.name", "Vibe Test"], { cwd });
  await writeFile(
    join(cwd, "package.json"),
    `${JSON.stringify({ version: "1.2.3", scripts: { test: "node -v" } }, null, 2)}\n`
  );
  await writeFile(join(cwd, "pyproject.toml"), '[project]\nversion = "1.2.3"\n');
  await writeFile(join(cwd, "Cargo.toml"), '[package]\nversion = "1.2.3"\n');
  await writeFile(join(cwd, "file.txt"), "one\n");
  await execFileAsync("git", ["add", "."], { cwd });
  await execFileAsync("git", ["commit", "-m", "initial"], { cwd });
  const config = await loadConfig(cwd);
  const state = await executePhaseOneWorkflow({
    cwd,
    prompt: "Fix password reset security OPENROUTER_API_KEY=secret-value",
    profile: "company-grade",
    config,
    runId: "run-phase9"
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
  await store.writeArtifact(runId, "rollback/pre-apply-metadata.json", { runId });
  await writeLedgerManifest(cwd, runId);
}

describe("phase 9 release config and packets", () => {
  it("validates release defaults and rejects unsafe settings", async () => {
    const { cwd } = await repo();
    const config = await loadConfig(cwd);
    expect(config.release.default_channel).toBe("internal");
    expect(config.release.allowed_channels).toContain("production");
    expect(config.release.deployment.execute_deploy_commands).toBe(false);
    expect((await validateTeamConfig(cwd, config)).ok).toBe(true);
    await expect(
      validateTeamConfig(cwd, {
        ...config,
        release: {
          ...config.release,
          release_branch: { ...config.release.release_branch, prefix: "../bad" }
        }
      })
    ).resolves.toMatchObject({ ok: false });
  });

  it("generates redacted release packet and verifies integrity", async () => {
    const { cwd, runId } = await repo();
    const summary = await generateReleasePacket(cwd, runId, { channel: "beta" });
    expect(summary.channel).toBe("beta");
    expect(JSON.stringify(summary)).not.toContain("secret-value");
    for (const file of [
      "RELEASE_PACKET.md",
      "RELEASE_SUMMARY.json",
      "RELEASE_MANIFEST.json",
      "RELEASE_CHECKLIST.md",
      "RELEASE_NOTES.md",
      "DEPLOYMENT_READINESS.md",
      "CI_STATUS.md"
    ]) {
      expect(
        await readFile(join(cwd, `.vibecli/runs/${runId}/release/${file}`), "utf8")
      ).toBeTruthy();
    }
    expect((await verifyReleaseIntegrity(cwd, runId)).ok).toBe(true);
    await writeFile(join(cwd, `.vibecli/runs/${runId}/release/RELEASE_NOTES.md`), "tampered\n");
    expect((await verifyReleaseIntegrity(cwd, runId)).ok).toBe(false);
  });
});

describe("phase 9 changelog version branch tag ci readiness", () => {
  it("generates and writes changelog with exact confirmation and rollback", async () => {
    const { cwd, runId } = await repo();
    const entry = await generateChangelogEntry(cwd, runId);
    expect(entry.warnings.join(" ")).toContain("proposed only");
    await expect(writeChangelog(cwd, runId, { confirm: "wrong" })).rejects.toThrow(
      "exact confirmation"
    );
    await writeChangelog(cwd, runId, { confirm: `WRITE CHANGELOG ${runId}` });
    expect(await readFile(join(cwd, "CHANGELOG.md"), "utf8")).toContain("## [Unreleased]");
  });

  it("plans and applies versions without touching lockfiles", async () => {
    const { cwd, runId } = await repo();
    const plan = await planVersion(cwd, runId, { bump: "patch" });
    expect(plan.currentVersion).toBe("1.2.3");
    expect(plan.plannedVersion).toBe("1.2.4");
    await expect(planVersion(cwd, runId, { version: "bad" })).rejects.toThrow("Invalid semver");
    await expect(planVersion(cwd, runId, { bump: "major" })).rejects.toThrow("PLAN MAJOR");
    await expect(applyVersionPlan(cwd, runId, { confirm: "wrong" })).rejects.toThrow(
      "exact confirmation"
    );
    await applyVersionPlan(cwd, runId, { confirm: `APPLY VERSION ${runId}` });
    expect(await readFile(join(cwd, "package.json"), "utf8")).toContain('"version": "1.2.4"');
  });

  it("previews release branch and tag and guards local creation", async () => {
    const { cwd, runId } = await repo();
    await markApplied(cwd, runId);
    await planVersion(cwd, runId, { bump: "patch" });
    expect((await releaseBranchRun(cwd, runId)).branch).toMatch(/^release\/1\.2\.4-/);
    await expect(releaseBranchRun(cwd, runId, { create: true, confirm: "wrong" })).rejects.toThrow(
      "exact confirmation"
    );
    const tag = await tagRun(cwd, runId);
    expect(tag.tag).toBe("v1.2.4");
    await expect(tagRun(cwd, runId, { create: true, confirm: "wrong" })).rejects.toThrow(
      "exact confirmation"
    );
  });

  it("ingests local CI and computes deployment and release readiness", async () => {
    const { cwd, runId } = await repo();
    await markApplied(cwd, runId);
    await writeFile(
      join(cwd, "ci.json"),
      JSON.stringify({
        checks: [{ name: "test", status: "completed", conclusion: "success", url: null }]
      })
    );
    expect((await showOrCreateLocalCiStatus(cwd, runId)).status).toBe("unknown");
    expect((await ingestCiFile(cwd, runId, "ci.json")).status).toBe("passed");
    await expect(ingestCiFile(cwd, runId, "../ci.json")).rejects.toThrow("relative");
    await generateReleasePacket(cwd, runId, { channel: "beta" });
    expect((await evaluateDeploymentReadiness(cwd, runId, { channel: "production" })).verdict).toBe(
      "ready_with_warnings"
    );
    expect((await evaluateReleaseReadiness(cwd, runId, { channel: "beta" })).verdict).toBe(
      "ready_with_warnings"
    );
  });

  it("records release approvals and parses console commands", async () => {
    const { cwd, runId } = await repo();
    await generateReleasePacket(cwd, runId);
    await expect(
      addReleaseApproval(cwd, runId, {
        decision: "approved",
        reviewer: "A",
        note: "ok",
        confirm: "wrong"
      })
    ).rejects.toThrow("exact confirmation");
    const notes = await addReleaseApproval(cwd, runId, {
      decision: "approved",
      reviewer: "Name",
      note: "Approved for beta",
      confirm: `ADD RELEASE APPROVAL ${runId}`
    });
    expect(notes.some((note) => note.type === "release")).toBe(true);
    for (const input of [
      "/release run-1",
      "/changelog run-1",
      "/version run-1",
      "/release-branch run-1",
      "/tag run-1",
      "/ci run-1",
      "/deployment-readiness run-1",
      "/deploy-readiness run-1",
      "/release-approval run-1",
      "/release-readiness run-1"
    ]) {
      expect(parseConsoleCommand(input).type).not.toBe("unknown");
    }
  });
});
