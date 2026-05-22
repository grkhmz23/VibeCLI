import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { initConfig, loadConfig, saveConfig } from "../config/config.js";
import { validateTeamConfig } from "../config/validator.js";
import { createEvidenceArchive } from "../evidence-lifecycle/archive.js";
import { verifyEvidenceArchive } from "../evidence-lifecycle/archive-verify.js";
import { generateEvidenceInventory } from "../evidence-lifecycle/inventory.js";
import { enableLegalHold } from "../evidence-lifecycle/legal-hold.js";
import { createDisposalAttestation } from "../evidence-disposal/attestation.js";
import { buildDisposalCandidates } from "../evidence-disposal/candidates.js";
import { createDisposalReport } from "../evidence-disposal/cross-run.js";
import { dryRunDisposal, executeDisposal } from "../evidence-disposal/delete.js";
import { evaluateDisposalEligibility } from "../evidence-disposal/expiry.js";
import {
  addDisposalApproval,
  getDisposalApprovals,
  verifyDisposalApprovals
} from "../evidence-disposal/approval.js";
import { createDisposalPlan } from "../evidence-disposal/plan.js";
import { runDisposalPrecheck } from "../evidence-disposal/predelete.js";
import { validateDisposalConfig } from "../evidence-disposal/validation.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { verifyLedger } from "../ledger/verify.js";
import { executePhaseOneWorkflow } from "../orchestrator/workflow.js";
import { buildReviewWorkspace } from "../orchestrator/workspace.js";
import { parseConsoleCommand } from "../terminal/shortcuts.js";

const execFileAsync = promisify(execFile);

async function repo(): Promise<{ cwd: string; runId: string }> {
  const cwd = await mkdtemp(join(tmpdir(), "vibecli-phase15-"));
  await initConfig(cwd);
  await execFileAsync("git", ["init"], { cwd });
  await execFileAsync("git", ["config", "user.email", "vibe@example.test"], { cwd });
  await execFileAsync("git", ["config", "user.name", "Vibe Test"], { cwd });
  await writeFile(join(cwd, "package.json"), `${JSON.stringify({ version: "1.2.3" })}\n`);
  await writeFile(join(cwd, "source.ts"), "export const source = true;\n");
  await execFileAsync("git", ["add", "."], { cwd });
  await execFileAsync("git", ["commit", "-m", "initial"], { cwd });
  const config = await loadConfig(cwd);
  const state = await executePhaseOneWorkflow({
    cwd,
    prompt: "Prepare governed disposal evidence",
    profile: "company-grade",
    config,
    runId: "run-phase15"
  });
  await writeLedgerManifest(cwd, state.runId);
  return { cwd, runId: state.runId };
}

async function markExpired(cwd: string, runId: string): Promise<void> {
  const marker = {
    runId,
    policy: "expired-test",
    retainUntil: "2000-01-01T00:00:00.000Z",
    legalHold: false
  };
  await mkdir(join(cwd, ".vibecli", "runs", runId, "org"), { recursive: true });
  await writeFile(
    join(cwd, ".vibecli", "runs", runId, "org", "RETENTION_MARKER.json"),
    `${JSON.stringify(marker, null, 2)}\n`
  );
  await writeLedgerManifest(cwd, runId);
}

async function readyForDisposal(cwd: string, runId: string): Promise<void> {
  await generateEvidenceInventory(cwd, runId);
  await createEvidenceArchive(cwd, runId, { confirm: `ARCHIVE EVIDENCE ${runId}` });
  expect((await verifyEvidenceArchive(cwd, runId)).ok).toBe(true);
  await markExpired(cwd, runId);
  await evaluateDisposalEligibility(cwd, runId);
  await buildDisposalCandidates(cwd, runId);
  await createDisposalAttestation(cwd, runId);
  await createDisposalPlan(cwd, runId);
}

describe("phase 15 disposal config eligibility and candidates", () => {
  it("validates defaults and rejects unsafe disposal settings", async () => {
    const { cwd } = await repo();
    const config = await loadConfig(cwd);
    expect(validateDisposalConfig(config.evidence_disposal)).toEqual([]);
    expect((await validateTeamConfig(cwd, config)).ok).toBe(true);
    config.evidence_disposal.allow_archive_deletion = true as false;
    expect(validateDisposalConfig(config.evidence_disposal).join(" ")).toContain(
      "allow_archive_deletion"
    );
    config.evidence_disposal.allow_archive_deletion = false;
    config.evidence_disposal.protected_classes = ["source-code"];
    expect(validateDisposalConfig(config.evidence_disposal).join(" ")).toContain("private-keys");
  });

  it("blocks legal hold, not-expired retention, missing archive, and summarizes all runs", async () => {
    const { cwd, runId } = await repo();
    expect((await evaluateDisposalEligibility(cwd, runId)).eligible).toBe(false);
    await enableLegalHold(cwd, runId, {
      reason: "Audit preservation",
      by: "Local Reviewer",
      confirm: `ENABLE LEGAL HOLD ${runId}`
    });
    const blocked = await evaluateDisposalEligibility(cwd, runId);
    expect(blocked.retention.legalHold).toBe(true);
    expect(blocked.blockingReasons.join(" ")).toContain("Legal hold");
    expect((await createDisposalReport(cwd)).summary.totalRuns).toBeGreaterThan(0);
  });

  it("creates conservative candidates only under the run evidence directory", async () => {
    const { cwd, runId } = await repo();
    await writeFile(join(cwd, ".vibecli", "runs", runId, "secret.private.pem"), "private\n");
    await writeFile(join(cwd, ".vibecli", "runs", runId, ".env"), "TOKEN=secret\n");
    await readyForDisposal(cwd, runId);
    const candidates = await buildDisposalCandidates(cwd, runId);
    expect(candidates.summary.candidateFiles).toBeGreaterThan(0);
    expect(candidates.candidates.every((candidate) => !candidate.path.startsWith(".."))).toBe(true);
    expect(candidates.blocked.find((entry) => entry.path === "secret.private.pem")).toBeTruthy();
    expect(candidates.blocked.find((entry) => entry.path === ".env")).toBeTruthy();
  });
});

describe("phase 15 plan attestation approvals precheck and execution", () => {
  it("plans, attests, dry-runs, executes only run evidence, and records disposal-aware ledger", async () => {
    const { cwd, runId } = await repo();
    await readyForDisposal(cwd, runId);
    const plan = await createDisposalPlan(cwd, runId);
    expect(["ready", "ready_with_warnings"]).toContain(plan.status);
    expect(plan.exactConfirmation).toBe(`DELETE EVIDENCE ${runId}`);
    expect((await runDisposalPrecheck(cwd, runId)).ok).toBe(true);
    expect((await dryRunDisposal(cwd, runId)).ok).toBe(true);
    await expect(executeDisposal(cwd, runId, { confirm: "wrong" })).rejects.toThrow(
      "DELETE EVIDENCE"
    );
    const receipt = await executeDisposal(cwd, runId, { confirm: `DELETE EVIDENCE ${runId}` });
    expect(receipt.status).toBe("completed");
    expect(receipt.deleted.length).toBeGreaterThan(0);
    expect(await readFile(join(cwd, "source.ts"), "utf8")).toContain("source");
    expect(
      await readFile(
        join(cwd, ".vibecli", "evidence-archive", runId, "EVIDENCE_ARCHIVE_MANIFEST.json"),
        "utf8"
      )
    ).toContain(runId);
    expect((await verifyLedger(cwd, runId)).status).toBe("pass_with_disposals");
    expect((await verifyLedger(cwd, runId, { strict: true })).ok).toBe(false);
  });

  it("requires exact approval confirmation, computes quorum, and detects approval tampering", async () => {
    const { cwd, runId } = await repo();
    const config = await loadConfig(cwd);
    config.evidence_disposal.require_org_approval = true;
    await saveConfig(cwd, config);
    await readyForDisposal(cwd, runId);
    expect((await createDisposalPlan(cwd, runId)).status).toBe("blocked");
    await expect(
      addDisposalApproval(cwd, runId, {
        reviewer: "local-reviewer",
        role: "release_manager",
        decision: "approved",
        note: "ok",
        confirm: "wrong"
      })
    ).rejects.toThrow("ADD DISPOSAL APPROVAL");
    const approvals = await addDisposalApproval(cwd, runId, {
      reviewer: "local-reviewer",
      role: "release_manager",
      decision: "approved",
      note: "Approved eligible local evidence disposal",
      confirm: `ADD DISPOSAL APPROVAL ${runId}`
    });
    expect(approvals.quorum.status).toBe("met");
    expect((await getDisposalApprovals(cwd, runId)).quorum.status).toBe("met");
    expect((await verifyDisposalApprovals(cwd, runId)).ok).toBe(true);
    await writeFile(
      join(cwd, ".vibecli", "runs", runId, "evidence-lifecycle", "disposal", "DISPOSAL_PLAN.json"),
      "{}\n"
    );
    expect((await verifyDisposalApprovals(cwd, runId)).ok).toBe(false);
  });

  it("precheck blocks tampered candidates and tampered receipts keep ledger strict", async () => {
    const { cwd, runId } = await repo();
    await readyForDisposal(cwd, runId);
    await createDisposalPlan(cwd, runId);
    await writeFile(join(cwd, ".vibecli", "runs", runId, "agent-events.jsonl"), "changed\n");
    expect((await runDisposalPrecheck(cwd, runId)).ok).toBe(false);

    const second = await repo();
    await readyForDisposal(second.cwd, second.runId);
    await createDisposalPlan(second.cwd, second.runId);
    await executeDisposal(second.cwd, second.runId, { confirm: `DELETE EVIDENCE ${second.runId}` });
    await writeFile(
      join(
        second.cwd,
        ".vibecli",
        "runs",
        second.runId,
        "evidence-lifecycle",
        "disposal",
        "DISPOSAL_RECEIPT.json"
      ),
      "{}\n"
    );
    expect((await verifyLedger(second.cwd, second.runId)).ok).toBe(false);
  });
});

describe("phase 15 console workspace regression", () => {
  it("parses disposal slash commands and exposes disposal state in workspace", async () => {
    const { cwd, runId } = await repo();
    expect(parseConsoleCommand("/disposal-eligibility run-1").type).toBe("disposal-eligibility");
    expect(parseConsoleCommand("/disposal-candidates run-1").type).toBe("disposal-candidates");
    expect(parseConsoleCommand("/disposal-plan run-1").type).toBe("disposal-plan");
    expect(parseConsoleCommand("/disposal-attestation run-1").type).toBe("disposal-attestation");
    expect(parseConsoleCommand("/disposal-approvals run-1").type).toBe("disposal-approvals");
    expect(parseConsoleCommand("/disposal-precheck run-1").type).toBe("disposal-precheck");
    expect(parseConsoleCommand("/disposal-execute run-1 --dry-run").type).toBe("disposal-execute");
    expect(parseConsoleCommand("/disposal-report").type).toBe("disposal-report");
    await readyForDisposal(cwd, runId);
    const workspace = await buildReviewWorkspace(cwd, runId);
    expect(workspace.evidenceDisposal.plan).not.toBe("not_started");
  });
});
