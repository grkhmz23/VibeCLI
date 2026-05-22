import { readdir } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { requiredSecurityCheckNames } from "../policies/security-policy.js";
import { requiredRunArtifacts } from "../orchestrator/artifacts.js";
import { executePhaseOneWorkflow } from "../orchestrator/workflow.js";
import { readJson } from "../utils/fs.js";

describe("run store", () => {
  it("writes all required run artifacts", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "vibecli-store-"));
    await executePhaseOneWorkflow({
      cwd,
      prompt: "Create a dry run",
      profile: "company-grade",
      runId: "run-artifacts"
    });
    const files = await readdir(join(cwd, ".vibecli", "runs", "run-artifacts"));
    for (const artifact of requiredRunArtifacts) {
      expect(files).toContain(artifact);
    }
  });

  it("security policy contains all required baseline checks", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "vibecli-security-"));
    await executePhaseOneWorkflow({
      cwd,
      prompt: "Check policy",
      profile: "company-grade",
      runId: "run-security"
    });
    const baseline = await readJson<Record<string, boolean>>(
      join(cwd, ".vibecli", "runs", "run-security", "security-baseline.json")
    );
    expect(Object.keys(baseline).sort()).toEqual(requiredSecurityCheckNames().sort());
    expect(Object.values(baseline).every(Boolean)).toBe(true);
  });
});
