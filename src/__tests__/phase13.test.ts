import { execFile } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { generateAuditCoverage } from "../audit/coverage.js";
import { createAuditExport, verifyAuditExport } from "../audit/export.js";
import { generateAuditEvidenceMap } from "../audit/evidence-mapper.js";
import { generateAuditGaps } from "../audit/gaps.js";
import { createComplianceBundle, verifyComplianceBundle } from "../audit/compliance-bundle.js";
import { createAuditorHandoff, verifyAuditorHandoff } from "../audit/auditor-handoff.js";
import { previewReviewerImport, applyReviewerImport } from "../audit/reviewer-import.js";
import { readReviewerDirectoryFile } from "../audit/reviewer-directory.js";
import { builtinAuditSchemas } from "../audit/builtin-schemas.js";
import { installDefaultAuditSchemas, validateAuditSchemas } from "../audit/schema-loader.js";
import { validateAuditConfig, validateAuditSchema } from "../audit/validation.js";
import { initConfig, loadConfig } from "../config/config.js";
import { validateTeamConfig } from "../config/validator.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { initOrgKey } from "../org/keyring.js";
import { initOrganization } from "../org/status.js";
import { executePhaseOneWorkflow } from "../orchestrator/workflow.js";
import { buildReviewWorkspace } from "../orchestrator/workspace.js";
import { parseConsoleCommand } from "../terminal/shortcuts.js";

const execFileAsync = promisify(execFile);

async function repo(): Promise<{ cwd: string; runId: string }> {
  const cwd = await mkdtemp(join(tmpdir(), "vibecli-phase13-"));
  await initConfig(cwd);
  await execFileAsync("git", ["init"], { cwd });
  await execFileAsync("git", ["config", "user.email", "vibe@example.test"], { cwd });
  await execFileAsync("git", ["config", "user.name", "Vibe Test"], { cwd });
  await writeFile(join(cwd, "package.json"), `${JSON.stringify({ version: "1.2.3" })}\n`);
  await writeFile(join(cwd, "file.txt"), "one\n");
  await execFileAsync("git", ["add", "."], { cwd });
  await execFileAsync("git", ["commit", "-m", "initial"], { cwd });
  const config = await loadConfig(cwd);
  const state = await executePhaseOneWorkflow({
    cwd,
    prompt: "Prepare enterprise audit interoperability with token sk-test-secret-value-1234567890",
    profile: "company-grade",
    config,
    runId: "run-phase13"
  });
  await writeLedgerManifest(cwd, state.runId);
  return { cwd, runId: state.runId };
}

describe("phase 13 audit configuration and schemas", () => {
  it("validates default audit config and rejects unsafe audit settings", async () => {
    const { cwd } = await repo();
    const config = await loadConfig(cwd);
    expect(validateAuditConfig(config.audit)).toEqual([]);
    expect((await validateTeamConfig(cwd, config)).ok).toBe(true);
    config.audit.include_raw_logs_by_default = true;
    expect(validateAuditConfig(config.audit).join(" ")).toContain("include_raw_logs");
    config.audit.include_raw_logs_by_default = false;
    config.audit.compliance_language.avoid_certification_claims = false;
    expect(validateAuditConfig(config.audit).join(" ")).toContain("avoid_certification_claims");
  });

  it("lists validates and installs built-in schemas without certification claims", async () => {
    const { cwd } = await repo();
    expect(builtinAuditSchemas().map((schema) => schema.name)).toContain("internal-secure-release");
    expect((await validateAuditSchemas(cwd)).every((result) => result.ok)).toBe(true);
    const bad = structuredClone(builtinAuditSchemas()[0]);
    bad.controls[0].id = "bad id";
    expect(validateAuditSchema(bad).join(" ")).toContain("unsafe");
    bad.controls[0].id = "BAD-ID";
    bad.description = "This certifies compliance";
    expect(validateAuditSchema(bad).join(" ")).toContain("certification");
    await installDefaultAuditSchemas(cwd);
    await expect(
      installDefaultAuditSchemas(cwd, { force: true, confirm: "wrong" })
    ).rejects.toThrow("INSTALL AUDIT SCHEMAS");
  });
});

describe("phase 13 audit mapping coverage gaps and exports", () => {
  it("creates audit map coverage and gaps with redacted summaries", async () => {
    const { cwd, runId } = await repo();
    const map = await generateAuditEvidenceMap(cwd, runId);
    expect(map.controls.length).toBeGreaterThan(0);
    expect(JSON.stringify(map)).not.toContain("sk-test-secret-value");
    expect(map.summary.missing).toBeGreaterThan(0);
    const coverage = await generateAuditCoverage(cwd, runId);
    expect(coverage.coverage.percentSatisfied).toBeGreaterThanOrEqual(0);
    expect(coverage.byCategory.length).toBeGreaterThan(0);
    const gaps = await generateAuditGaps(cwd, runId);
    expect(gaps.gaps.some((gap) => gap.priority === "p0")).toBe(true);
    expect(JSON.stringify(gaps.gaps.flatMap((gap) => gap.recommendedVibeCommands))).not.toMatch(
      /deploy|publish|push|merge|delete|force/i
    );
  });

  it("creates verifies signs and detects tampered audit export and compliance handoff bundles", async () => {
    const { cwd, runId } = await repo();
    await initOrganization(cwd, { confirm: "INIT ORGANIZATION" });
    await initOrgKey(cwd, { confirm: "CREATE ORG KEY" });
    await expect(createAuditExport(cwd, runId, { sign: true, confirm: "wrong" })).rejects.toThrow(
      "SIGN AUDIT EXPORT"
    );
    await createAuditExport(cwd, runId, { sign: true, confirm: `SIGN AUDIT EXPORT ${runId}` });
    expect((await verifyAuditExport(cwd, runId)).ok).toBe(true);
    await createComplianceBundle(cwd, runId, {
      sign: true,
      confirm: `SIGN COMPLIANCE BUNDLE ${runId}`
    });
    expect((await verifyComplianceBundle(cwd, runId)).ok).toBe(true);
    await createAuditorHandoff(cwd, runId);
    expect((await verifyAuditorHandoff(cwd, runId)).ok).toBe(true);
    await writeFile(
      join(cwd, ".vibecli", "runs", runId, "audit", "export", "AUDIT_REPORT.json"),
      "{}\n"
    );
    expect((await verifyAuditExport(cwd, runId)).ok).toBe(false);
  });

  it("surfaces audit state in workspace", async () => {
    const { cwd, runId } = await repo();
    await generateAuditCoverage(cwd, runId);
    const workspace = await buildReviewWorkspace(cwd, runId, false);
    expect(workspace.audit.coverage).toBe("generated");
    expect(workspace.audit.activeSchema).toBe("internal-secure-release");
  });
});

describe("phase 13 reviewer directory and console parser", () => {
  it("validates JSON YAML and CSV reviewer files and applies only with confirmation", async () => {
    const { cwd } = await repo();
    const jsonPath = "reviewers.json";
    const yamlPath = "reviewers.yaml";
    const csvPath = "reviewers.csv";
    await writeFile(
      join(cwd, jsonPath),
      JSON.stringify([
        {
          id: "alice",
          displayName: "Alice Security",
          email: "alice@example.test",
          roles: ["security"],
          active: true
        }
      ])
    );
    await writeFile(
      join(cwd, yamlPath),
      "- id: bob\n  displayName: Bob Release\n  roles: [release_manager]\n  active: true\n"
    );
    await writeFile(
      join(cwd, csvPath),
      "id,displayName,emailHash,roles,active\ncarol,Carol Ops,,owner|release_manager,true\n"
    );
    expect((await readReviewerDirectoryFile(cwd, jsonPath)).rawEmailsHashed).toBe(true);
    expect((await readReviewerDirectoryFile(cwd, yamlPath)).errors).toEqual([]);
    expect((await readReviewerDirectoryFile(cwd, csvPath)).reviewers[0]?.roles).toContain("owner");
    await expect(applyReviewerImport(cwd, jsonPath, { confirm: "wrong" })).rejects.toThrow(
      "IMPORT REVIEWERS"
    );
    const preview = await previewReviewerImport(cwd, jsonPath);
    expect(preview.toAdd).toContain("alice");
    await applyReviewerImport(cwd, jsonPath, { confirm: "IMPORT REVIEWERS" });
    expect((await loadConfig(cwd)).organization.reviewers.map((reviewer) => reviewer.id)).toContain(
      "alice"
    );
  });

  it("parses Phase 13 console commands", () => {
    expect(parseConsoleCommand("/audit-schemas list").type).toBe("audit-schemas");
    expect(parseConsoleCommand("/audit-map run-1").type).toBe("audit-map");
    expect(parseConsoleCommand("/audit-coverage run-1").type).toBe("audit-coverage");
    expect(parseConsoleCommand("/audit-gaps run-1").type).toBe("audit-gaps");
    expect(parseConsoleCommand("/audit-export run-1").type).toBe("audit-export");
    expect(parseConsoleCommand("/compliance-bundle run-1").type).toBe("compliance-bundle");
    expect(parseConsoleCommand("/reviewer-directory import --file reviewers.yaml").type).toBe(
      "reviewer-directory"
    );
    expect(parseConsoleCommand("/auditor-handoff run-1").type).toBe("auditor-handoff");
  });
});
