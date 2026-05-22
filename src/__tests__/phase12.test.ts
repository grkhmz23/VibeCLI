import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { initConfig, loadConfig, saveConfig } from "../config/config.js";
import { validateTeamConfig } from "../config/validator.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { createOrgAuditReport } from "../org/audit-report.js";
import { verifyOrgAuditLog } from "../org/audit-log.js";
import { addOrgApproval, getApprovalMatrix, verifyApprovalMatrix } from "../org/approval-matrix.js";
import { createEvidenceExport, verifyEvidenceExport } from "../org/evidence-export-policy.js";
import { exportOrgPublicKey, initOrgKey, orgKeyStatus } from "../org/keyring.js";
import {
  createOrgPolicyBundle,
  showOrgPolicyBundle,
  verifyOrgPolicyBundle
} from "../org/policy-bundle.js";
import { createRetentionPlan } from "../org/retention.js";
import { initOrganization, listOrgReviewers, orgAuditSummary, orgStatus } from "../org/status.js";
import { validateOrganizationConfig } from "../org/validation.js";
import { executePhaseOneWorkflow } from "../orchestrator/workflow.js";
import { buildReviewWorkspace } from "../orchestrator/workspace.js";
import { refreshReceipt } from "../remote-attestation/receipt-refresh.js";
import { generateReleasePacket } from "../release/packet.js";
import { evaluateReleaseReadiness } from "../release/release-readiness.js";
import { buildHandoffSummary } from "../handoff/bundle.js";
import { buildLifecycle } from "../git-lifecycle/lifecycle.js";
import { parseConsoleCommand } from "../terminal/shortcuts.js";

const execFileAsync = promisify(execFile);

async function repo(): Promise<{ cwd: string; runId: string }> {
  const cwd = await mkdtemp(join(tmpdir(), "vibecli-phase12-"));
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
    prompt: "Prepare audited organization workflow with secret sk-test-secret-value",
    profile: "company-grade",
    config,
    runId: "run-phase12"
  });
  await writeLedgerManifest(cwd, state.runId);
  await generateReleasePacket(cwd, state.runId, { channel: "beta" });
  return { cwd, runId: state.runId };
}

describe("phase 12 organization config and commands", () => {
  it("validates defaults and rejects unsafe organization config", async () => {
    const { cwd } = await repo();
    const config = await loadConfig(cwd);
    expect(validateOrganizationConfig(config.organization)).toEqual([]);
    expect((await validateTeamConfig(cwd, config)).ok).toBe(true);
    config.organization.org_id = "Bad Org";
    expect(validateOrganizationConfig(config.organization).join(" ")).toContain("org_id");
    config.organization.org_id = "local-org";
    config.organization.reviewers[0].id = "bad reviewer";
    expect(validateOrganizationConfig(config.organization).join(" ")).toContain("Reviewer id");
    config.organization.reviewers[0].id = "local-reviewer";
    config.organization.retention.policies.standard.retention_days = 0;
    expect(validateOrganizationConfig(config.organization).join(" ")).toContain("retention_days");
    config.organization.retention.policies.standard.retention_days = 365;
    config.organization.org_name = "sk-test-secret-value-1234567890";
    expect(validateOrganizationConfig(config.organization).join(" ")).toContain("secret");
  });

  it("initializes organization directories and reports reviewers/audit", async () => {
    const { cwd } = await repo();
    expect((await orgStatus(cwd)).enabled).toBe(false);
    await expect(initOrganization(cwd, { confirm: "wrong" })).rejects.toThrow("exact confirmation");
    await initOrganization(cwd, { confirm: "INIT ORGANIZATION" });
    expect((await orgStatus(cwd)).enabled).toBe(true);
    expect((await listOrgReviewers(cwd))[0]?.roles).toContain("release_manager");
    expect((await orgAuditSummary(cwd, true)).eventCount).toBeGreaterThan(0);
  });

  it("creates org key without printing private key and refuses unsafe rotation", async () => {
    const { cwd } = await repo();
    await initOrganization(cwd, { confirm: "INIT ORGANIZATION" });
    expect((await orgKeyStatus(cwd)).status).toBe("missing");
    await expect(initOrgKey(cwd, { confirm: "wrong" })).rejects.toThrow("exact confirmation");
    const metadata = await initOrgKey(cwd, { confirm: "CREATE ORG KEY" });
    expect(metadata.publicKeyFingerprint).toMatch(/^[a-f0-9]{32}$/);
    expect(JSON.stringify(metadata)).not.toContain("BEGIN PRIVATE KEY");
    expect((await exportOrgPublicKey(cwd)).pem).toContain("BEGIN PUBLIC KEY");
    await expect(initOrgKey(cwd, { rotate: true, confirm: "wrong" })).rejects.toThrow(
      "ROTATE ORG KEY"
    );
  });
});

describe("phase 12 policy bundles audit approvals and retention", () => {
  it("signs and verifies policy bundle and detects tampering", async () => {
    const { cwd } = await repo();
    await initOrganization(cwd, { confirm: "INIT ORGANIZATION" });
    await initOrgKey(cwd, { confirm: "CREATE ORG KEY" });
    const bundle = await createOrgPolicyBundle(cwd);
    expect(bundle.type).toBe("vibecli.organization.policy-bundle");
    await expect(createOrgPolicyBundle(cwd, { sign: true, confirm: "wrong" })).rejects.toThrow(
      "SIGN ORG POLICY"
    );
    await createOrgPolicyBundle(cwd, { sign: true, confirm: "SIGN ORG POLICY" });
    expect((await verifyOrgPolicyBundle(cwd)).ok).toBe(true);
    expect((await showOrgPolicyBundle(cwd)).org.orgId).toBe("local-org");
    const bundlePath = join(
      cwd,
      ".vibecli",
      "org",
      "policy-bundles",
      "latest",
      "ORG_POLICY_BUNDLE.json"
    );
    await writeFile(
      bundlePath,
      (await readFile(bundlePath, "utf8")).replace("local-org", "tamper")
    );
    expect((await verifyOrgPolicyBundle(cwd)).ok).toBe(false);
  });

  it("audit log detects tampered event and approvals enforce quorum", async () => {
    const { cwd, runId } = await repo();
    await initOrganization(cwd, { confirm: "INIT ORGANIZATION" });
    await expect(
      addOrgApproval(cwd, runId, {
        reviewer: "local-reviewer",
        role: "release_manager",
        decision: "approved",
        note: "approved",
        confirm: "wrong"
      })
    ).rejects.toThrow("exact confirmation");
    await expect(
      addOrgApproval(cwd, runId, {
        reviewer: "missing",
        role: "release_manager",
        decision: "approved",
        note: "approved",
        confirm: `ADD ORG APPROVAL ${runId}`
      })
    ).rejects.toThrow("not configured");
    expect((await getApprovalMatrix(cwd, runId)).quorum.status).toBe("not_met");
    const matrix = await addOrgApproval(cwd, runId, {
      reviewer: "local-reviewer",
      role: "release_manager",
      decision: "approved",
      note: "Approved but redact sk-test-secret-value-1234567890",
      confirm: `ADD ORG APPROVAL ${runId}`
    });
    expect(matrix.quorum.status).toBe("met");
    expect(JSON.stringify(matrix)).not.toContain("sk-test-secret");
    expect((await verifyApprovalMatrix(cwd, runId)).ok).toBe(true);
    const logPath = join(cwd, ".vibecli", "org", "audit", "audit-log.jsonl");
    await writeFile(logPath, (await readFile(logPath, "utf8")).replace("org.init", "org.tamper"));
    expect((await verifyOrgAuditLog(cwd)).ok).toBe(false);
  });

  it("creates retention plans, evidence exports, org reports, and report integrations", async () => {
    const { cwd, runId } = await repo();
    await initOrganization(cwd, { confirm: "INIT ORGANIZATION" });
    const legal = await createRetentionPlan(cwd, runId, { policy: "legal-hold" });
    expect(legal.retainUntil).toBeNull();
    await expect(createRetentionPlan(cwd, runId, { mark: true, confirm: "wrong" })).rejects.toThrow(
      "MARK RETENTION"
    );
    const retention = await createRetentionPlan(cwd, runId, {
      mark: true,
      confirm: `MARK RETENTION ${runId}`
    });
    expect(retention.purgePreview.length).toBeGreaterThan(0);
    const exported = await createEvidenceExport(cwd, runId, { mode: "audit" });
    expect(exported.archivePath).toContain("audit");
    expect((await verifyEvidenceExport(cwd, runId)).ok).toBe(true);
    const report = await createOrgAuditReport(cwd, runId);
    expect(report.retention.marked).toBe(true);
    expect((await buildReviewWorkspace(cwd, runId)).organization.retention).toBe("marked");
    expect((await buildHandoffSummary(cwd, runId)).organization?.retention).toBe("marked");
    expect((await buildLifecycle(cwd, runId)).organization.retention).toBe("marked");
  });
});

describe("phase 12 release integration receipt refresh and console", () => {
  it("production readiness includes org approval status", async () => {
    const { cwd, runId } = await repo();
    const config = await loadConfig(cwd);
    config.organization.require_multi_reviewer_approval_for_release = true;
    await saveConfig(cwd, config);
    const readiness = await evaluateReleaseReadiness(cwd, runId, { channel: "production" });
    expect(readiness.orgApproval?.status).not.toBe("not_required");
    expect(readiness.blockingReasons.join(" ")).toContain("Organization approval quorum");
  });

  it("receipt refresh is read-only by default and supports mocked remote GET", async () => {
    const { cwd, runId } = await repo();
    await mkdir(join(cwd, ".vibecli", "runs", runId, "remote-attestation"), { recursive: true });
    await writeFile(
      join(cwd, ".vibecli", "runs", runId, "remote-attestation", "REMOTE_SUBMISSION_RECEIPT.json"),
      `${JSON.stringify(
        {
          runId,
          createdAt: new Date().toISOString(),
          target: "local-test",
          targetType: "generic-http",
          targetHost: "example.test",
          submitted: true,
          statusCode: 200,
          requestSha256: "a".repeat(64),
          responseSha256: "b".repeat(64),
          remoteReceiptId: "r-1",
          remoteUrl: "https://example.test/receipt/r-1",
          warnings: [],
          errors: []
        },
        null,
        2
      )}\n`
    );
    const dry = await refreshReceipt(cwd, runId, { dryRun: true });
    expect(dry.warnings.join(" ")).toContain("Dry run");
    await expect(
      refreshReceipt(cwd, runId, { verifyRemote: true, confirm: "wrong" })
    ).rejects.toThrow("VERIFY REMOTE RECEIPT");
    let calls = 0;
    const verified = await refreshReceipt(cwd, runId, {
      verifyRemote: true,
      confirm: `VERIFY REMOTE RECEIPT ${runId}`,
      get: () => {
        calls += 1;
        return Promise.resolve({
          statusCode: 200,
          body: JSON.stringify({ receiptId: "r-1", entryHash: "c".repeat(64) })
        });
      }
    });
    expect(calls).toBe(1);
    expect(verified.verified).toBe(true);
    expect(verified.matchesLocalReceipt).toBe(true);
  });

  it("parses Phase 12 console commands", () => {
    expect(parseConsoleCommand("/org status").type).toBe("org");
    expect(parseConsoleCommand('/org init --confirm "INIT ORGANIZATION"').type).toBe("org");
    expect(parseConsoleCommand("/org reviewers").type).toBe("org");
    expect(parseConsoleCommand("/org audit --verify").type).toBe("org");
    expect(parseConsoleCommand("/org key status").type).toBe("org");
    expect(parseConsoleCommand('/org key init --confirm "CREATE ORG KEY"').type).toBe("org");
    expect(parseConsoleCommand("/org-policy bundle").type).toBe("org-policy");
    expect(parseConsoleCommand("/org-policy verify").type).toBe("org-policy");
    expect(parseConsoleCommand("/org-approvals run-1").type).toBe("org-approvals");
    expect(parseConsoleCommand("/receipt-refresh run-1").type).toBe("receipt-refresh");
    expect(parseConsoleCommand("/retention run-1").type).toBe("retention");
    expect(parseConsoleCommand("/evidence-export run-1").type).toBe("evidence-export");
    expect(parseConsoleCommand("/org-report run-1").type).toBe("org-report");
  });
});
