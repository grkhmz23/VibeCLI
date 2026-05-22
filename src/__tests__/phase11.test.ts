import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { mkdtemp } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { initConfig, loadConfig, saveConfig } from "../config/config.js";
import { validateTeamConfig } from "../config/validator.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { executePhaseOneWorkflow } from "../orchestrator/workflow.js";
import { buildReviewWorkspace } from "../orchestrator/workspace.js";
import { initProvenanceKey } from "../provenance/keyring.js";
import { signProvenance } from "../provenance/envelope.js";
import { createEvidenceBundle } from "../provenance/evidence-bundle.js";
import { generateReleasePacket } from "../release/packet.js";
import { evaluateReleaseReadiness } from "../release/release-readiness.js";
import { createAttestationExport } from "../remote-attestation/export-pack.js";
import { generateRegistryMetadata } from "../remote-attestation/registry-metadata.js";
import { submitAttestation } from "../remote-attestation/submit.js";
import {
  addRemoteTarget,
  disableRemoteTarget,
  doctorRemoteTargets,
  listRemoteTargets
} from "../remote-attestation/targets.js";
import {
  appendTransparencyEntry,
  generateTransparencyEntry,
  verifyTransparencyLog
} from "../remote-attestation/transparency.js";
import { validateRemoteTarget } from "../remote-attestation/validation.js";
import { buildHandoffSummary } from "../handoff/bundle.js";
import { buildLifecycle } from "../git-lifecycle/lifecycle.js";
import { parseConsoleCommand } from "../terminal/shortcuts.js";

const execFileAsync = promisify(execFile);

async function repo(): Promise<{ cwd: string; runId: string }> {
  const cwd = await mkdtemp(join(tmpdir(), "vibecli-phase11-"));
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
    prompt: "Prepare remote attestation OPENAI_API_KEY=secret-value",
    profile: "company-grade",
    config,
    runId: "run-phase11"
  });
  await writeLedgerManifest(cwd, state.runId);
  await generateReleasePacket(cwd, state.runId, { channel: "beta" });
  return { cwd, runId: state.runId };
}

async function signedRepo(): Promise<{ cwd: string; runId: string }> {
  const value = await repo();
  await initProvenanceKey(value.cwd, { confirm: "CREATE PROVENANCE KEY" });
  await signProvenance(value.cwd, value.runId, { confirm: `SIGN PROVENANCE ${value.runId}` });
  await createEvidenceBundle(value.cwd, value.runId, {
    sign: true,
    confirm: `SIGN EVIDENCE ${value.runId}`
  });
  await createAttestationExport(value.cwd, value.runId);
  await appendTransparencyEntry(value.cwd, value.runId, `APPEND TRANSPARENCY ${value.runId}`);
  return value;
}

describe("phase 11 remote attestation config and targets", () => {
  it("validates defaults and rejects unsafe targets", async () => {
    const { cwd } = await repo();
    const config = await loadConfig(cwd);
    expect(config.remote_attestation.allow_remote_submission).toBe(false);
    expect((await validateTeamConfig(cwd, config)).ok).toBe(true);
    expect(
      validateRemoteTarget(
        "org-log",
        {
          type: "generic-http",
          url: "https://attestations.example.com/v1/entries",
          token_env: "VIBECLI_ATTESTATION_TOKEN",
          enabled: true,
          headers: { "X-Source": "vibecli" }
        },
        config.remote_attestation
      )
    ).toEqual([]);
    expect(
      validateRemoteTarget(
        "bad",
        { type: "generic-http", url: "file:///tmp/x", enabled: true, headers: {} },
        config.remote_attestation
      ).join(" ")
    ).toContain("unsupported");
    expect(
      validateRemoteTarget(
        "private",
        { type: "generic-http", url: "https://192.168.1.2/x", enabled: true, headers: {} },
        config.remote_attestation
      ).join(" ")
    ).toContain("private-network");
  });

  it("adds, lists, doctors, and disables targets without storing raw tokens", async () => {
    const { cwd } = await repo();
    await expect(
      addRemoteTarget(cwd, {
        name: "org-log",
        url: "https://attestations.example.com/v1/entries",
        tokenEnv: "VIBECLI_ATTESTATION_TOKEN",
        confirm: "wrong"
      })
    ).rejects.toThrow("exact confirmation");
    await addRemoteTarget(cwd, {
      name: "org-log",
      url: "https://attestations.example.com/v1/entries",
      tokenEnv: "VIBECLI_ATTESTATION_TOKEN",
      confirm: "ADD REMOTE TARGET org-log"
    });
    expect((await listRemoteTargets(cwd))[0]?.tokenEnv).toBe("VIBECLI_ATTESTATION_TOKEN");
    expect(await readFile(join(cwd, ".vibecli", "config.yaml"), "utf8")).not.toContain(
      "secret-value"
    );
    expect((await doctorRemoteTargets(cwd))[0]?.warnings.join(" ")).toContain(
      "VIBECLI_ATTESTATION_TOKEN"
    );
    await expect(doctorRemoteTargets(cwd, { ping: true, confirm: "wrong" })).rejects.toThrow(
      "PING REMOTE TARGETS"
    );
    await disableRemoteTarget(cwd, "org-log", "DISABLE REMOTE TARGET org-log");
    expect((await listRemoteTargets(cwd))[0]?.enabled).toBe(false);
  });
});

describe("phase 11 export transparency registry and submission", () => {
  it("creates redacted attestation export artifacts", async () => {
    const { cwd, runId } = await repo();
    const value = await createAttestationExport(cwd, runId);
    expect(value.warnings.join(" ")).toContain("Signed provenance");
    expect(JSON.stringify(value)).not.toContain("secret-value");
    expect(JSON.stringify(value)).not.toContain("Prepare remote attestation");
    for (const file of ["ATTESTATION_EXPORT.json", "REMOTE_PAYLOAD.json", "EXPORT_MANIFEST.json"]) {
      expect(
        await readFile(join(cwd, `.vibecli/runs/${runId}/remote-attestation/${file}`), "utf8")
      ).toBeTruthy();
    }
  });

  it("creates and verifies local transparency chain and detects tampering", async () => {
    const { cwd, runId } = await repo();
    const entry = await generateTransparencyEntry(cwd, runId);
    expect(entry.entryHash).toMatch(/^[a-f0-9]{64}$/);
    await expect(appendTransparencyEntry(cwd, runId, "wrong")).rejects.toThrow(
      "exact confirmation"
    );
    await appendTransparencyEntry(cwd, runId, `APPEND TRANSPARENCY ${runId}`);
    expect((await verifyTransparencyLog(cwd, runId)).ok).toBe(true);
    const chainPath = join(cwd, ".vibecli", "transparency-log", "chain.json");
    await writeFile(chainPath, (await readFile(chainPath, "utf8")).replace(/.$/s, "x"));
    expect((await verifyTransparencyLog(cwd, runId)).ok).toBe(false);
  });

  it("generates registry metadata without registry calls", async () => {
    const { cwd, runId } = await repo();
    const metadata = await generateRegistryMetadata(cwd, runId, {
      image: "ghcr.io/example/app",
      tag: "1.2.3"
    });
    expect(metadata.annotations["dev.vibecli.run_id"]).toBe(runId);
    expect(metadata.image.name).toBe("ghcr.io/example/app");
    expect(
      await readFile(
        join(cwd, `.vibecli/runs/${runId}/remote-attestation/OCI_ANNOTATIONS.env`),
        "utf8"
      )
    ).toContain("dev.vibecli.run_id");
    await expect(generateRegistryMetadata(cwd, runId, { image: "Bad Image!" })).rejects.toThrow(
      "Unsafe"
    );
  });

  it("dry-runs submission without remote calls and blocks missing target", async () => {
    const { cwd, runId } = await repo();
    const receipt = await submitAttestation(cwd, runId, { target: "missing", dryRun: true });
    expect(receipt.submitted).toBe(false);
    expect(receipt.errors.join(" ")).toContain("missing");
  });

  it("submits metadata to mocked HTTP target with redacted token handling", async () => {
    const { cwd, runId } = await signedRepo();
    let calls = 0;
    let body = "";
    const config = await loadConfig(cwd);
    config.remote_attestation.allow_remote_submission = true;
    config.remote_attestation.targets["local-test"] = {
      type: "generic-http",
      url: "https://attestations.example.com/v1/entries",
      token_env: "VIBECLI_ATTESTATION_TOKEN",
      enabled: true,
      headers: { "X-Source": "vibecli" }
    };
    await saveConfig(cwd, config);
    process.env.VIBECLI_ATTESTATION_TOKEN = "test-token";
    try {
      const receipt = await submitAttestation(cwd, runId, {
        target: "local-test",
        confirm: `SUBMIT ATTESTATION ${runId} TO local-test`,
        post: (_url, payload, headers) => {
          calls += 1;
          expect(headers.authorization).toBe("Bearer test-token");
          body = JSON.stringify(payload);
          return Promise.resolve({
            statusCode: 200,
            body: JSON.stringify({ receiptId: "r-1", url: "https://example.test/receipt/r-1" })
          });
        }
      });
      expect(receipt.submitted).toBe(true);
      expect(receipt.remoteReceiptId).toBe("r-1");
      expect(JSON.stringify(receipt)).not.toContain("test-token");
      expect(body).toContain('"metadataOnly":true');
      expect(calls).toBe(1);
    } finally {
      delete process.env.VIBECLI_ATTESTATION_TOKEN;
    }
  });
});

describe("phase 11 reporting and console integration", () => {
  it("includes remote attestation state in workspace, handoff, lifecycle, and readiness", async () => {
    const { cwd, runId } = await repo();
    await createAttestationExport(cwd, runId);
    await generateRegistryMetadata(cwd, runId);
    const workspace = await buildReviewWorkspace(cwd, runId);
    expect(workspace.remoteAttestation.export).toBe("generated");
    expect((await buildHandoffSummary(cwd, runId)).remoteAttestation?.registryMetadata).toBe(
      "generated"
    );
    expect((await buildLifecycle(cwd, runId)).remoteAttestation.export).toBe("generated");
    const readiness = await evaluateReleaseReadiness(cwd, runId, { channel: "production" });
    expect(readiness.blockingReasons.join(" ")).toContain("transparency");
  });

  it("parses Phase 11 console commands", () => {
    for (const input of [
      "/remote-targets list",
      "/remote-targets doctor",
      "/attestation export run-1",
      "/attestation submit run-1 --target org --dry-run",
      "/attestation receipt run-1",
      "/transparency run-1",
      "/registry-metadata run-1"
    ]) {
      expect(parseConsoleCommand(input).type).not.toBe("unknown");
    }
  });
});
