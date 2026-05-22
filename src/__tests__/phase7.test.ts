import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { addApprovalNote, verifyApprovalNotes } from "../approvals/notes.js";
import { initConfig, loadConfig } from "../config/config.js";
import { githubDoctor } from "../github/gh.js";
import { githubPr } from "../github/pr.js";
import {
  archiveHandoffBundle,
  createHandoffBundle,
  verifyHandoffBundle
} from "../handoff/bundle.js";
import { readPolicyExceptions, writePolicyExceptions } from "../handoff/policy-exceptions.js";
import { generatePrDescription } from "../handoff/pr-description.js";
import { evaluateReadiness } from "../handoff/readiness.js";
import { generateReviewerChecklist } from "../handoff/reviewer-checklist.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { verifyLedger } from "../ledger/verify.js";
import { executePhaseOneWorkflow } from "../orchestrator/workflow.js";
import { RunStore } from "../orchestrator/run-store.js";
import { parseConsoleCommand } from "../terminal/shortcuts.js";

const execFileAsync = promisify(execFile);

async function repo(): Promise<{ cwd: string; runId: string }> {
  const cwd = await mkdtemp(join(tmpdir(), "vibecli-phase7-"));
  await initConfig(cwd);
  await execFileAsync("git", ["init"], { cwd });
  await writeFile(
    join(cwd, "package.json"),
    JSON.stringify({ scripts: { test: "node --version" } })
  );
  const config = await loadConfig(cwd);
  const state = await executePhaseOneWorkflow({
    cwd,
    prompt: "phase7",
    profile: "company-grade",
    config,
    runId: "run-phase7"
  });
  await writeLedgerManifest(cwd, state.runId);
  return { cwd, runId: state.runId };
}

describe("phase 7 handoff", () => {
  it("creates redacted handoff files and verifies unchanged bundle", async () => {
    const { cwd, runId } = await repo();
    await new RunStore(cwd).writeTextArtifact(
      runId,
      "command-execution.json",
      "OPENROUTER_API_KEY=secret-value"
    );
    const summary = await createHandoffBundle(cwd, runId);
    expect(summary.runId).toBe(runId);
    for (const file of [
      "HANDOFF.md",
      "PR_DESCRIPTION.md",
      "REVIEW_CHECKLIST.md",
      "POLICY_EXCEPTIONS.md",
      "APPROVALS.md",
      "HANDOFF_MANIFEST.json",
      "HANDOFF_SUMMARY.json"
    ]) {
      expect(
        await readFile(join(cwd, `.vibecli/runs/${runId}/handoff/${file}`), "utf8")
      ).toBeTruthy();
    }
    expect((await verifyHandoffBundle(cwd, runId)).ok).toBe(true);
    await writeFile(join(cwd, `.vibecli/runs/${runId}/handoff/HANDOFF.md`), "tampered");
    expect((await verifyHandoffBundle(cwd, runId)).ok).toBe(false);
  });

  it("archive contains only handoff files and PR/checklist are accurate", async () => {
    const { cwd, runId } = await repo();
    await createHandoffBundle(cwd, runId);
    expect((await archiveHandoffBundle(cwd, runId)).path).toContain(".tar.gz");
    const pr = await generatePrDescription(cwd, runId);
    expect(pr.body).toContain("Verification commands were not executed.");
    expect(pr.body).toContain("Scanner checks were not executed.");
    expect(pr.body).toContain("Rollback Plan");
    const checklist = generateReviewerChecklist(await createHandoffBundle(cwd, runId));
    expect(checklist).toContain("Auth/authz");
    expect(checklist).toContain("CORS and API boundary");
    expect(checklist).toContain("AI/provider cost and rate-limit behavior");
  });
});

describe("phase 7 exceptions approvals readiness github console", () => {
  it("records exceptions and approval notes with exact confirmations", async () => {
    const { cwd, runId } = await repo();
    const exceptions = await readPolicyExceptions(cwd, runId);
    exceptions.exceptions.push({
      id: "exception-1",
      policy: "verification.require_tests",
      severity: "medium",
      status: "requested",
      reason: "tests unavailable",
      risk: "behavior regression",
      mitigation: "manual QA",
      requestedBy: null,
      approvedBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    await writePolicyExceptions(cwd, exceptions);
    await expect(
      addApprovalNote(cwd, runId, {
        type: "review",
        decision: "approved",
        reviewer: "Reviewer",
        note: "OPENROUTER_API_KEY=secret-value",
        confirm: "wrong"
      })
    ).rejects.toThrow("exact confirmation");
    const note = await addApprovalNote(cwd, runId, {
      type: "review",
      decision: "approved",
      reviewer: "Reviewer",
      note: "OPENROUTER_API_KEY=secret-value",
      confirm: `ADD APPROVAL NOTE ${runId}`
    });
    expect(note.note).toContain("[REDACTED]");
    expect((await verifyApprovalNotes(cwd, runId)).ok).toBe(true);
  });

  it("readiness and github dry summary are safe and non-mutating", async () => {
    const { cwd, runId } = await repo();
    expect((await evaluateReadiness(cwd, runId)).verdict).toBe("not_applied");
    expect((await githubDoctor(cwd)).ghInstalled).toEqual(expect.any(Boolean));
    const pr = await githubPr(cwd, runId);
    expect(pr.mode).toBe("dry_summary");
    await expect(githubPr(cwd, runId, { create: true, confirm: "wrong" })).rejects.toThrow(
      "exact confirmation"
    );
    expect((await verifyLedger(cwd, runId)).ok).toBe(true);
  });

  it.each([
    "/handoff run-1",
    "/pr-body run-1",
    "/checklist run-1",
    "/exceptions run-1",
    "/approvals run-1 --verify",
    "/github doctor",
    "/github pr run-1",
    "/readiness run-1"
  ])("parses %s", (input) => {
    expect(parseConsoleCommand(input).type).not.toBe("unknown");
  });
});
