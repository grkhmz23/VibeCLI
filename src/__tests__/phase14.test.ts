import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { createAuditExport } from "../audit/export.js";
import { createAuditorHandoff } from "../audit/auditor-handoff.js";
import { initConfig, loadConfig } from "../config/config.js";
import { validateTeamConfig } from "../config/validator.js";
import { createEvidenceArchive, previewEvidenceArchive } from "../evidence-lifecycle/archive.js";
import { verifyEvidenceArchive } from "../evidence-lifecycle/archive-verify.js";
import {
  createCompactEvidenceBundle,
  createCompactionReport,
  verifyCompactEvidenceBundle
} from "../evidence-lifecycle/compaction.js";
import { createEvidenceReport } from "../evidence-lifecycle/cross-run-report.js";
import {
  generateEvidenceInventory,
  summarizeAllInventories
} from "../evidence-lifecycle/inventory.js";
import {
  createEvidenceLifecycleIndex,
  createEvidenceLifecycleReport
} from "../evidence-lifecycle/lifecycle-report.js";
import {
  enableLegalHold,
  legalHoldStatus,
  releaseLegalHold
} from "../evidence-lifecycle/legal-hold.js";
import { previewRetentionEnforcement } from "../evidence-lifecycle/retention-enforcement.js";
import {
  recordManualRetentionEvent,
  retentionLedgerSummary
} from "../evidence-lifecycle/retention-ledger.js";
import { verifyRetentionLedger } from "../evidence-lifecycle/retention-ledger-verify.js";
import { validateEvidenceLifecycleConfig } from "../evidence-lifecycle/validation.js";
import { buildLifecycle } from "../git-lifecycle/lifecycle.js";
import { buildHandoffSummary } from "../handoff/bundle.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { initOrgKey } from "../org/keyring.js";
import { createOrgAuditReport } from "../org/audit-report.js";
import { initOrganization } from "../org/status.js";
import { executePhaseOneWorkflow } from "../orchestrator/workflow.js";
import { buildReviewWorkspace } from "../orchestrator/workspace.js";
import { initProvenanceKey } from "../provenance/keyring.js";
import { generateReleasePacket } from "../release/packet.js";
import { parseConsoleCommand } from "../terminal/shortcuts.js";

const execFileAsync = promisify(execFile);

async function repo(): Promise<{ cwd: string; runId: string }> {
  const cwd = await mkdtemp(join(tmpdir(), "vibecli-phase14-"));
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
    prompt: "Prepare evidence lifecycle with secret sk-test-secret-value-1234567890",
    profile: "company-grade",
    config,
    runId: "run-phase14"
  });
  await generateReleasePacket(cwd, state.runId, { channel: "beta" });
  await writeLedgerManifest(cwd, state.runId);
  return { cwd, runId: state.runId };
}

describe("phase 14 evidence lifecycle config and inventory", () => {
  it("validates defaults and rejects unsafe lifecycle settings", async () => {
    const { cwd } = await repo();
    const config = await loadConfig(cwd);
    expect(validateEvidenceLifecycleConfig(config.evidence_lifecycle)).toEqual([]);
    expect((await validateTeamConfig(cwd, config)).ok).toBe(true);
    config.evidence_lifecycle.delete_originals_after_archive = true as false;
    expect(validateEvidenceLifecycleConfig(config.evidence_lifecycle).join(" ")).toContain(
      "delete_originals"
    );
    config.evidence_lifecycle.delete_originals_after_archive = false;
    config.evidence_lifecycle.purge_enabled = true as false;
    expect(validateEvidenceLifecycleConfig(config.evidence_lifecycle).join(" ")).toContain("purge");
    config.evidence_lifecycle.purge_enabled = false;
    config.evidence_lifecycle.redaction.exclude_private_keys = false;
    expect(validateEvidenceLifecycleConfig(config.evidence_lifecycle).join(" ")).toContain(
      "private_keys"
    );
  });

  it("creates inventory, classifies artifacts, blocks private keys and env files, and summarizes all runs", async () => {
    const { cwd, runId } = await repo();
    await writeFile(join(cwd, ".vibecli", "runs", runId, "fake.private.pem"), "PRIVATE KEY\n");
    await writeFile(join(cwd, ".vibecli", "runs", runId, ".env"), "TOKEN=secret\n");
    await writeFile(join(cwd, ".vibecli", "runs", runId, ".env.example"), "TOKEN=\n");
    await writeFile(
      join(cwd, ".vibecli", "runs", runId, "agent-outputs", "raw-output.txt"),
      "raw provider output"
    );
    const inventory = await generateEvidenceInventory(cwd, runId);
    expect(inventory.summary.totalFiles).toBeGreaterThan(0);
    expect(inventory.files.find((file) => file.path === "fake.private.pem")?.sensitivity).toBe(
      "blocked"
    );
    expect(inventory.files.find((file) => file.path === ".env")?.sensitivity).toBe("blocked");
    expect(inventory.files.find((file) => file.path === ".env.example")?.excluded).toBe(false);
    expect(inventory.files.find((file) => file.path.includes("raw-output"))?.excluded).toBe(true);
    expect((await summarizeAllInventories(cwd)).runs[0]?.status).toBe("generated");
  });
});

describe("phase 14 retention preview archive ledger and legal hold", () => {
  it("creates lifecycle and retention previews without deleting evidence", async () => {
    const { cwd, runId } = await repo();
    await generateEvidenceInventory(cwd, runId);
    const report = await createEvidenceLifecycleReport(cwd, runId);
    expect(report.inventory.status).toBe("generated");
    expect((await createEvidenceLifecycleIndex(cwd)).runs[0]?.runId).toBe(runId);
    const preview = await previewRetentionEnforcement(cwd, runId);
    expect(preview.purgeImplemented).toBe(false);
    expect(preview.warnings.join(" ")).toContain("not implemented");
  });

  it("creates verifies signs archives and detects tampering without deleting originals", async () => {
    const { cwd, runId } = await repo();
    expect((await previewEvidenceArchive(cwd, runId)).files).toBeGreaterThan(0);
    await expect(
      createEvidenceArchive(cwd, runId, { create: true, confirm: "wrong" })
    ).rejects.toThrow("ARCHIVE EVIDENCE");
    const manifest = await createEvidenceArchive(cwd, runId, {
      create: true,
      confirm: `ARCHIVE EVIDENCE ${runId}`
    });
    expect(manifest.archivePath).toContain(".vibecli/evidence-archive");
    expect(await readFile(join(cwd, ".vibecli", "runs", runId, "state.json"), "utf8")).toContain(
      runId
    );
    expect((await verifyEvidenceArchive(cwd, runId)).ok).toBe(true);
    await writeFile(join(cwd, manifest.archivePath), "tampered\n");
    expect((await verifyEvidenceArchive(cwd, runId)).ok).toBe(false);

    const { cwd: orgCwd, runId: orgRunId } = await repo();
    await initOrganization(orgCwd, { confirm: "INIT ORGANIZATION" });
    await initOrgKey(orgCwd, { confirm: "CREATE ORG KEY" });
    expect(
      (
        await createEvidenceArchive(orgCwd, orgRunId, {
          create: true,
          sign: true,
          confirm: `ARCHIVE EVIDENCE ${orgRunId}`
        })
      ).signature.algorithm
    ).toBe("ed25519");
    const { cwd: provenanceCwd, runId: provenanceRunId } = await repo();
    await initProvenanceKey(provenanceCwd, { confirm: "CREATE PROVENANCE KEY" });
    expect(
      (
        await createEvidenceArchive(provenanceCwd, provenanceRunId, {
          create: true,
          sign: true,
          confirm: `ARCHIVE EVIDENCE ${provenanceRunId}`
        })
      ).signature.algorithm
    ).toBe("ed25519");
  });

  it("records and verifies retention ledger and legal hold metadata", async () => {
    const { cwd, runId } = await repo();
    await generateEvidenceInventory(cwd, runId);
    expect((await retentionLedgerSummary(cwd, runId)).eventCount).toBeGreaterThan(0);
    expect((await verifyRetentionLedger(cwd)).ok).toBe(true);
    await expect(
      recordManualRetentionEvent(cwd, runId, {
        event: "retention_previewed",
        summary: "manual sk-test-secret-value-1234567890",
        confirm: "wrong"
      })
    ).rejects.toThrow("RECORD RETENTION EVENT");
    await recordManualRetentionEvent(cwd, runId, {
      event: "retention_previewed",
      summary: "manual sk-test-secret-value-1234567890",
      confirm: `RECORD RETENTION EVENT ${runId}`
    });
    expect(JSON.stringify(await retentionLedgerSummary(cwd, runId))).not.toContain("sk-test");
    await expect(enableLegalHold(cwd, runId, { confirm: "wrong" })).rejects.toThrow(
      "ENABLE LEGAL HOLD"
    );
    const hold = await enableLegalHold(cwd, runId, {
      reason: "Audit preservation",
      by: "Local Reviewer",
      confirm: `ENABLE LEGAL HOLD ${runId}`
    });
    expect(hold.status).toBe("enabled");
    expect((await previewRetentionEnforcement(cwd, runId)).purgeCandidates).toEqual([]);
    await expect(releaseLegalHold(cwd, runId, { confirm: "wrong" })).rejects.toThrow(
      "RELEASE LEGAL HOLD"
    );
    expect(
      (
        await releaseLegalHold(cwd, runId, {
          reason: "Hold no longer required",
          by: "Local Reviewer",
          confirm: `RELEASE LEGAL HOLD ${runId}`
        })
      ).status
    ).toBe("released");
    expect((await legalHoldStatus(cwd, runId)).status).toBe("released");
  });
});

describe("phase 14 compaction cross-run and integration", () => {
  it("creates compaction reports bundles and cross-run reports without deleting originals", async () => {
    const { cwd, runId } = await repo();
    const report = await createCompactionReport(cwd, runId);
    expect(report.deleteOriginalsRecommended).toBe(false);
    await expect(createCompactEvidenceBundle(cwd, runId, { confirm: "wrong" })).rejects.toThrow(
      "CREATE COMPACT EVIDENCE"
    );
    await createCompactEvidenceBundle(cwd, runId, { confirm: `CREATE COMPACT EVIDENCE ${runId}` });
    expect((await verifyCompactEvidenceBundle(cwd, runId)).ok).toBe(true);
    await writeFile(
      join(
        cwd,
        ".vibecli",
        "runs",
        runId,
        "evidence-lifecycle",
        "compact",
        `vibecli-compact-evidence-${runId}.tar.gz`
      ),
      "tampered\n"
    );
    expect((await verifyCompactEvidenceBundle(cwd, runId)).ok).toBe(false);
    const crossRun = await createEvidenceReport(cwd, { deep: true });
    expect(crossRun.summary.totalRuns).toBeGreaterThan(0);
  });

  it("surfaces evidence lifecycle state in workspace handoff lifecycle release org audit and auditor handoff", async () => {
    const { cwd, runId } = await repo();
    await generateEvidenceInventory(cwd, runId);
    await createEvidenceLifecycleReport(cwd, runId);
    await generateReleasePacket(cwd, runId, { channel: "beta" });
    const workspace = await buildReviewWorkspace(cwd, runId, false);
    expect(workspace.evidenceLifecycle.inventory).toBe("generated");
    expect((await buildHandoffSummary(cwd, runId)).evidenceLifecycle?.inventory).toBe("generated");
    expect((await buildLifecycle(cwd, runId)).evidenceLifecycle.inventory).toBe("generated");
    expect(
      await readFile(join(cwd, ".vibecli", "runs", runId, "release", "RELEASE_PACKET.md"), "utf8")
    ).toContain("Evidence lifecycle");
    await createOrgAuditReport(cwd, runId);
    expect(
      await readFile(join(cwd, ".vibecli", "runs", runId, "org", "ORG_AUDIT_REPORT.md"), "utf8")
    ).toContain("Evidence lifecycle");
    await createAuditExport(cwd, runId);
    await createAuditorHandoff(cwd, runId);
    expect(
      await readFile(
        join(cwd, ".vibecli", "runs", runId, "audit", "auditor-handoff", "AUDITOR_HANDOFF.json"),
        "utf8"
      )
    ).toContain("evidenceLifecycle");
  });

  it("parses Phase 14 console commands", () => {
    expect(parseConsoleCommand("/evidence-inventory run-1").type).toBe("evidence-inventory");
    expect(parseConsoleCommand("/evidence-lifecycle run-1").type).toBe("evidence-lifecycle");
    expect(parseConsoleCommand("/retention-enforce run-1").type).toBe("retention-enforce");
    expect(parseConsoleCommand("/evidence-archive run-1").type).toBe("evidence-archive");
    expect(parseConsoleCommand("/retention-ledger --verify").type).toBe("retention-ledger");
    expect(parseConsoleCommand("/legal-hold run-1").type).toBe("legal-hold");
    expect(parseConsoleCommand("/evidence-compact run-1").type).toBe("evidence-compact");
    expect(parseConsoleCommand("/evidence-report").type).toBe("evidence-report");
  });
});
