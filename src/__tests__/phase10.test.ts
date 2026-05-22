import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzip } from "node:zlib";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { initConfig, loadConfig } from "../config/config.js";
import { validateTeamConfig } from "../config/validator.js";
import { buildLifecycle } from "../git-lifecycle/lifecycle.js";
import { githubReleaseDraft } from "../github/release-draft.js";
import { createHandoffBundle } from "../handoff/bundle.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { executePhaseOneWorkflow } from "../orchestrator/workflow.js";
import { RunStore } from "../orchestrator/run-store.js";
import { validatePolicyProfile } from "../policies/profile-validator.js";
import { createChecksums, verifyChecksums } from "../provenance/checksums.js";
import { createEvidenceBundle, verifyEvidenceBundle } from "../provenance/evidence-bundle.js";
import { initProvenanceKey, keyStatus, exportPublicKey } from "../provenance/keyring.js";
import { generateProvenanceStatement } from "../provenance/statement.js";
import { signProvenance } from "../provenance/envelope.js";
import { verifyProvenance } from "../provenance/verify.js";
import { generateReleasePacket } from "../release/packet.js";
import { evaluateReleaseReadiness } from "../release/release-readiness.js";
import { tagRun } from "../release/tag.js";
import { planVersion } from "../release/version.js";
import { buildReviewWorkspace } from "../orchestrator/workspace.js";
import { parseConsoleCommand } from "../terminal/shortcuts.js";

const execFileAsync = promisify(execFile);
const gunzipAsync = promisify(gunzip);

async function repo(): Promise<{ cwd: string; runId: string }> {
  const cwd = await mkdtemp(join(tmpdir(), "vibecli-phase10-"));
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
    prompt: "Prepare beta release OPENAI_API_KEY=secret-value",
    profile: "company-grade",
    config,
    runId: "run-phase10"
  });
  await writeLedgerManifest(cwd, state.runId);
  await generateReleasePacket(cwd, state.runId, { channel: "beta" });
  await evaluateReleaseReadiness(cwd, state.runId, { channel: "beta" });
  return { cwd, runId: state.runId };
}

async function markReady(cwd: string, runId: string): Promise<void> {
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

describe("phase 10 provenance config and key management", () => {
  it("validates provenance defaults and policy constraints", async () => {
    const { cwd } = await repo();
    const config = await loadConfig(cwd);
    expect(config.provenance.format).toBe("slsa-inspired");
    expect(config.provenance.signing.algorithm).toBe("ed25519");
    expect(config.provenance.github_release.publish_releases).toBe(false);
    expect(config.provenance.github_release.upload_assets).toBe(false);
    expect(await readFile(join(cwd, ".gitignore"), "utf8")).toContain("*.private.pem");
    expect((await validateTeamConfig(cwd, config)).ok).toBe(true);
    expect(
      (
        await validateTeamConfig(cwd, {
          ...config,
          provenance: {
            ...config.provenance,
            github_release: { ...config.provenance.github_release, publish_releases: true }
          }
        } as never)
      ).ok
    ).toBe(false);
    expect((await validatePolicyProfile(cwd, "strict-enterprise")).ok).toBe(true);
  });

  it("guards key creation and never exports private key material", async () => {
    const { cwd } = await repo();
    expect((await keyStatus(cwd)).status).toBe("missing");
    await expect(initProvenanceKey(cwd, { confirm: "wrong" })).rejects.toThrow(
      "exact confirmation"
    );
    const metadata = await initProvenanceKey(cwd, { confirm: "CREATE PROVENANCE KEY" });
    expect(metadata.algorithm).toBe("ed25519");
    expect((await keyStatus(cwd)).status).toBe("present");
    const exported = await exportPublicKey(cwd);
    expect(exported.pem).toContain("BEGIN PUBLIC KEY");
    expect(JSON.stringify(exported)).not.toContain("PRIVATE KEY");
    await expect(
      initProvenanceKey(cwd, { rotate: true, confirm: "CREATE PROVENANCE KEY" })
    ).rejects.toThrow("ROTATE PROVENANCE KEY");
  });
});

describe("phase 10 provenance, checksums, evidence, and release draft", () => {
  it("generates unsigned provenance with hashes and redaction", async () => {
    const { cwd, runId } = await repo();
    const statement = await generateProvenanceStatement(cwd, runId);
    expect(statement.invocation.promptHash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(statement)).not.toContain("secret-value");
    expect(statement.metadata.releaseChannel).toBe("beta");
    expect(
      await readFile(join(cwd, `.vibecli/runs/${runId}/provenance/PROVENANCE.md`), "utf8")
    ).toContain("SLSA-inspired local provenance");
  });

  it("signs provenance, verifies it, and detects tampering", async () => {
    const { cwd, runId } = await repo();
    await initProvenanceKey(cwd, { confirm: "CREATE PROVENANCE KEY" });
    await expect(signProvenance(cwd, runId, { confirm: "wrong" })).rejects.toThrow(
      "exact confirmation"
    );
    const envelope = await signProvenance(cwd, runId, { confirm: `SIGN PROVENANCE ${runId}` });
    expect(envelope.signature.publicKeyFingerprint).toBeTruthy();
    expect((await verifyProvenance(cwd, runId)).ok).toBe(true);
    await writeFile(
      join(cwd, `.vibecli/runs/${runId}/provenance/provenance-statement.json`),
      `${JSON.stringify({ tampered: true }, null, 2)}\n`
    );
    expect((await verifyProvenance(cwd, runId)).ok).toBe(false);
  });

  it("creates and verifies release-safe checksums", async () => {
    const { cwd, runId } = await repo();
    const manifest = await createChecksums(cwd, runId);
    expect(manifest.entries.some((entry) => entry.path.includes(".env"))).toBe(false);
    expect(manifest.entries.some((entry) => entry.path.includes("private.pem"))).toBe(false);
    expect((await verifyChecksums(cwd, runId)).ok).toBe(true);
    await writeFile(join(cwd, `.vibecli/runs/${runId}/release/RELEASE_PACKET.md`), "tampered\n");
    expect((await verifyChecksums(cwd, runId)).ok).toBe(false);
  });

  it("creates evidence bundles and verifies signed evidence", async () => {
    const { cwd, runId } = await repo();
    await initProvenanceKey(cwd, { confirm: "CREATE PROVENANCE KEY" });
    await writeFile(join(cwd, `.vibecli/runs/${runId}/agent-outputs-raw.json`), "secret\n");
    await expect(
      createEvidenceBundle(cwd, runId, { sign: true, confirm: "wrong" })
    ).rejects.toThrow("exact confirmation");
    const manifest = await createEvidenceBundle(cwd, runId, {
      sign: true,
      confirm: `SIGN EVIDENCE ${runId}`
    });
    expect(manifest.signed).toBe(true);
    const archive = await gunzipAsync(
      await readFile(join(cwd, `.vibecli/runs/${runId}`, manifest.archivePath))
    );
    const archiveText = archive.toString("utf8");
    expect(archiveText).not.toContain("agent-outputs-raw");
    expect(archiveText).not.toContain(".vibecli/keys");
    expect((await verifyEvidenceBundle(cwd, runId)).ok).toBe(true);
    await writeFile(join(cwd, `.vibecli/runs/${runId}`, manifest.archivePath), "tampered\n");
    expect((await verifyEvidenceBundle(cwd, runId)).ok).toBe(false);
  });

  it("previews GitHub releases and blocks draft mutation without required evidence", async () => {
    const { cwd, runId } = await repo();
    await markReady(cwd, runId);
    await planVersion(cwd, runId, { bump: "patch" });
    const tagPlan = await tagRun(cwd, runId);
    expect(tagPlan.tag).toBe("v1.2.4");
    const preview = await githubReleaseDraft(cwd, runId);
    expect(preview.mode).toBe("preview");
    expect(preview.draftUrl).toBeNull();
    await expect(
      githubReleaseDraft(cwd, runId, { createDraft: true, confirm: "wrong" })
    ).rejects.toThrow("exact confirmation");
    const blocked = await githubReleaseDraft(cwd, runId, {
      createDraft: true,
      confirm: `CREATE RELEASE DRAFT ${runId}`
    });
    expect(blocked.mode).toBe("failed");
    expect(blocked.errors.join(" ")).toContain("Signed provenance");
  });
});

describe("phase 10 reporting and console integration", () => {
  it("includes provenance state in workspace, handoff, lifecycle, and release readiness", async () => {
    const { cwd, runId } = await repo();
    await initProvenanceKey(cwd, { confirm: "CREATE PROVENANCE KEY" });
    await signProvenance(cwd, runId, { confirm: `SIGN PROVENANCE ${runId}` });
    const workspace = await buildReviewWorkspace(cwd, runId);
    expect(workspace.provenance.signature).toBe("signed");
    const handoff = await createHandoffBundle(cwd, runId);
    expect(handoff.provenance?.signature).toBe("signed");
    const lifecycle = await buildLifecycle(cwd, runId);
    expect(lifecycle.provenance.signature).toBe("signed");
    const readiness = await evaluateReleaseReadiness(cwd, runId, { channel: "production" });
    expect(readiness.blockingReasons.join(" ")).not.toContain("signed provenance");
  });

  it("parses Phase 10 console commands", () => {
    for (const input of [
      "/provenance run-1",
      "/provenance key status",
      '/provenance key init --confirm "CREATE PROVENANCE KEY"',
      "/checksums run-1",
      "/evidence run-1",
      "/github release run-1"
    ]) {
      expect(parseConsoleCommand(input).type).not.toBe("unknown");
    }
  });
});
