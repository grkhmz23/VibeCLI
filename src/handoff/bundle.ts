import { gzip } from "node:zlib";
import { promisify } from "node:util";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ensureDir, pathExists, readJson } from "../utils/fs.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { verifyLedger } from "../ledger/verify.js";
import { sha256File, sha256Text } from "../ledger/hash.js";
import { reviewRun } from "../orchestrator/diff.js";
import { RunStore } from "../orchestrator/run-store.js";
import { evaluateReadiness } from "./readiness.js";
import { generatePrDescription } from "./pr-description.js";
import { generateReviewerChecklist } from "./reviewer-checklist.js";
import { readPolicyExceptions, renderPolicyExceptions } from "./policy-exceptions.js";
import { redactHandoffText, redactJson } from "./redaction.js";
import type { HandoffManifest, HandoffSummary } from "./types.js";

const gzipAsync = promisify(gzip);

async function optionalJson<T>(path: string): Promise<T | undefined> {
  return pathExists(path) ? readJson<T>(path) : undefined;
}

export async function buildHandoffSummary(cwd: string, runId: string): Promise<HandoffSummary> {
  const store = new RunStore(cwd);
  const state = await store.readState(runId);
  const runPath = store.runPath(runId);
  const manifest = await optionalJson<{
    patches: Array<{ applied: boolean; path: string }>;
  }>(join(runPath, "patches", "manifest.json"));
  const review = await reviewRun(cwd, runId).catch(() => undefined);
  const ledger = await verifyLedger(cwd, runId).catch(() => undefined);
  const scannerStatus = state.scanners
    ? `${state.scanners.builtinStatus}/${state.scanners.externalStatus}`
    : null;
  const risks = [
    ...(state.scanners?.criticalFindings
      ? [
          {
            severity: "critical" as const,
            source: "scanner",
            message: `${state.scanners.criticalFindings} critical scanner findings`,
            recommendation: "Resolve before PR handoff."
          }
        ]
      : []),
    ...(state.scanners?.highFindings
      ? [
          {
            severity: "high" as const,
            source: "scanner",
            message: `${state.scanners.highFindings} high scanner findings`,
            recommendation: "Resolve or document policy exception."
          }
        ]
      : [])
  ];
  const total = manifest?.patches.length ?? 0;
  const applied = manifest?.patches.filter((patch) => patch.applied).length ?? 0;
  const blocked = review?.filesAffected.filter((file) => file.blocked).length ?? 0;
  return redactJson({
    runId,
    createdAt: new Date().toISOString(),
    policy: state.policy ?? null,
    profile: null,
    routingStrategy: state.routingStrategy ?? null,
    runStatus: state.status,
    approvalStatus: state.approval.status,
    applyStatus: state.apply.status,
    verificationStatus: state.verification?.status ?? null,
    scannerStatus,
    ledgerStatus: ledger ? (ledger.ok ? "pass" : "fail") : "missing",
    sourceModified: state.apply.status === "applied",
    filesChanged: state.apply.filesChanged,
    lifecycle: {
      branch: state.lifecycle?.branch?.current ?? null,
      commit: state.lifecycle?.commit?.status ?? "not_started",
      pr: state.lifecycle?.pr?.status ?? "not_started",
      mergeReadiness: state.lifecycle?.mergeReadiness?.verdict ?? "not_started"
    },
    release: {
      packet: state.release?.packet.status ?? "not_started",
      channel: state.release?.packet.channel ?? null,
      changelog: state.release?.changelog.status ?? "not_started",
      version: state.release?.version.status ?? "not_started",
      releaseBranch: state.release?.releaseBranch.status ?? "not_started",
      tag: state.release?.tag.status ?? "not_started",
      ci: state.release?.ci.status ?? "not_started",
      deploymentReadiness: state.release?.deploymentReadiness.verdict ?? "not_started",
      releaseReadiness: state.release?.releaseReadiness.verdict ?? "not_started"
    },
    provenance: {
      key: state.provenance?.key.status ?? "unknown",
      publicKeyFingerprint: state.provenance?.key.publicKeyFingerprint ?? null,
      statement: state.provenance?.statement.status ?? "not_started",
      signature: state.provenance?.signature.status ?? "not_started",
      checksums: state.provenance?.checksums.status ?? "not_started",
      evidence: state.provenance?.evidence.status ?? "not_started",
      githubReleaseDraft: state.provenance?.githubReleaseDraft.status ?? "not_started"
    },
    remoteAttestation: {
      export: state.remoteAttestation?.export.status ?? "not_started",
      transparency: state.remoteAttestation?.transparency.status ?? "not_started",
      submission: state.remoteAttestation?.submission.status ?? "not_started",
      registryMetadata: state.remoteAttestation?.registryMetadata.status ?? "not_started"
    },
    organization: {
      enabled: state.organization?.enabled ?? false,
      policyBundle: state.organization?.policyBundle.status ?? "not_started",
      approvals: state.organization?.approvals.status ?? "not_started",
      receiptRefresh: state.organization?.receiptRefresh.status ?? "not_started",
      retention: state.organization?.retention.status ?? "not_started",
      evidenceExport: state.organization?.evidenceExport.status ?? "not_started",
      audit: state.organization?.audit.status ?? "not_started",
      report: state.organization?.report.status ?? "not_started"
    },
    evidenceLifecycle: {
      inventory: state.evidenceLifecycle?.inventory.status ?? "not_started",
      archive: state.evidenceLifecycle?.archive.status ?? "not_started",
      retentionLedger: state.evidenceLifecycle?.retentionLedger.status ?? "not_started",
      legalHold: state.evidenceLifecycle?.legalHold.status ?? "not_started",
      compaction: state.evidenceLifecycle?.compaction.status ?? "not_started",
      report: state.evidenceLifecycle?.report.status ?? "not_started"
    },
    evidenceDisposal: {
      eligibility: state.evidenceDisposal?.eligibility.status ?? "not_started",
      candidates: state.evidenceDisposal?.candidates.status ?? "not_started",
      plan: state.evidenceDisposal?.plan.status ?? "not_started",
      approvals: state.evidenceDisposal?.approvals.status ?? "not_started",
      precheck: state.evidenceDisposal?.precheck.status ?? "not_started",
      execution: state.evidenceDisposal?.execution.status ?? "not_started"
    },
    patches: { total, applied, pending: total - applied, blocked },
    gates: Object.entries(state.gates).map(([name, gate]) => ({
      name,
      status: gate.status,
      blocking: gate.status === "failed" || gate.status === "requires_repair"
    })),
    risks,
    nextActions:
      state.apply.status === "applied"
        ? [`vibe readiness ${runId}`, `vibe github pr ${runId}`]
        : [`vibe review ${runId} --diff`, `vibe apply ${runId} --confirm "APPLY ${runId}"`]
  });
}

export async function writeHandoffManifest(cwd: string, runId: string): Promise<HandoffManifest> {
  const handoffPath = join(new RunStore(cwd).runPath(runId), "handoff");
  const files = [];
  for (const entry of await readdir(handoffPath).catch(() => [])) {
    if (entry === "HANDOFF_MANIFEST.json") continue;
    if (!entry.endsWith(".md") && !entry.endsWith(".json") && !entry.endsWith(".tar.gz")) continue;
    const path = join(handoffPath, entry);
    const hash = await sha256File(path);
    files.push({ path: `handoff/${entry}`, ...hash });
  }
  files.sort((a, b) => a.path.localeCompare(b.path));
  const base = { runId, createdAt: new Date().toISOString(), algorithm: "sha256" as const, files };
  const manifest = { ...base, manifestHash: sha256Text(JSON.stringify(base, null, 2)) };
  await writeFile(
    join(handoffPath, "HANDOFF_MANIFEST.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  );
  return manifest;
}

export async function createHandoffBundle(cwd: string, runId: string): Promise<HandoffSummary> {
  const store = new RunStore(cwd);
  const handoffPath = join(store.runPath(runId), "handoff");
  await ensureDir(handoffPath);
  await writeLedgerManifest(cwd, runId).catch(() => undefined);
  const summary = await buildHandoffSummary(cwd, runId);
  const pr = await generatePrDescription(cwd, runId, summary);
  const checklist = generateReviewerChecklist(summary);
  const exceptions = await readPolicyExceptions(cwd, runId);
  const readiness = await evaluateReadiness(cwd, runId).catch(() => undefined);
  const handoff = `# VibeCLI Handoff

Run id: ${runId}

Status: ${summary.runStatus}

Policy: ${summary.policy ?? "none"}

Readiness: ${readiness?.verdict ?? "unknown"}

Lifecycle: branch=${summary.lifecycle?.branch ?? "unknown"} commit=${summary.lifecycle?.commit ?? "not_started"} pr=${summary.lifecycle?.pr ?? "not_started"} merge=${summary.lifecycle?.mergeReadiness ?? "not_started"}

Release: packet=${summary.release?.packet ?? "not_started"} channel=${summary.release?.channel ?? "unknown"} changelog=${summary.release?.changelog ?? "not_started"} version=${summary.release?.version ?? "not_started"} branch=${summary.release?.releaseBranch ?? "not_started"} tag=${summary.release?.tag ?? "not_started"} ci=${summary.release?.ci ?? "not_started"} deploy=${summary.release?.deploymentReadiness ?? "not_started"} readiness=${summary.release?.releaseReadiness ?? "not_started"}

Provenance: key=${summary.provenance?.key ?? "unknown"} statement=${summary.provenance?.statement ?? "not_started"} signature=${summary.provenance?.signature ?? "not_started"} checksums=${summary.provenance?.checksums ?? "not_started"} evidence=${summary.provenance?.evidence ?? "not_started"} githubRelease=${summary.provenance?.githubReleaseDraft ?? "not_started"}

Remote attestation: export=${summary.remoteAttestation?.export ?? "not_started"} transparency=${summary.remoteAttestation?.transparency ?? "not_started"} submission=${summary.remoteAttestation?.submission ?? "not_started"} registry=${summary.remoteAttestation?.registryMetadata ?? "not_started"}

Organization: enabled=${summary.organization?.enabled ?? false} policyBundle=${summary.organization?.policyBundle ?? "not_started"} approvals=${summary.organization?.approvals ?? "not_started"} receiptRefresh=${summary.organization?.receiptRefresh ?? "not_started"} retention=${summary.organization?.retention ?? "not_started"} evidenceExport=${summary.organization?.evidenceExport ?? "not_started"} audit=${summary.organization?.audit ?? "not_started"} report=${summary.organization?.report ?? "not_started"}

Evidence lifecycle: inventory=${summary.evidenceLifecycle?.inventory ?? "not_started"} archive=${summary.evidenceLifecycle?.archive ?? "not_started"} retentionLedger=${summary.evidenceLifecycle?.retentionLedger ?? "not_started"} legalHold=${summary.evidenceLifecycle?.legalHold ?? "not_started"} compaction=${summary.evidenceLifecycle?.compaction ?? "not_started"} report=${summary.evidenceLifecycle?.report ?? "not_started"}

Evidence disposal: eligibility=${summary.evidenceDisposal?.eligibility ?? "not_started"} candidates=${summary.evidenceDisposal?.candidates ?? "not_started"} plan=${summary.evidenceDisposal?.plan ?? "not_started"} approvals=${summary.evidenceDisposal?.approvals ?? "not_started"} precheck=${summary.evidenceDisposal?.precheck ?? "not_started"} execution=${summary.evidenceDisposal?.execution ?? "not_started"}

## Next Safe Actions

${summary.nextActions.map((action) => `- ${action}`).join("\n")}
`;
  await store.writeTextArtifact(runId, "handoff/HANDOFF.md", redactHandoffText(handoff));
  await store.writeTextArtifact(runId, "handoff/PR_DESCRIPTION.md", pr.body);
  await store.writeTextArtifact(runId, "handoff/REVIEW_CHECKLIST.md", redactHandoffText(checklist));
  await store.writeTextArtifact(
    runId,
    "handoff/POLICY_EXCEPTIONS.md",
    redactHandoffText(renderPolicyExceptions(exceptions))
  );
  await store.writeTextArtifact(runId, "handoff/APPROVALS.md", "No approval notes recorded.\n");
  await store.writeArtifact(runId, "handoff/HANDOFF_SUMMARY.json", summary);
  await writeHandoffManifest(cwd, runId);
  await writeLedgerManifest(cwd, runId);
  return summary;
}

export async function verifyHandoffBundle(
  cwd: string,
  runId: string
): Promise<{
  runId: string;
  ok: boolean;
  ledgerStatus: "pass" | "fail" | "missing";
  files: Array<{ path: string; ok: boolean; reason: string }>;
}> {
  const handoffPath = join(new RunStore(cwd).runPath(runId), "handoff");
  const manifest = await readJson<HandoffManifest>(join(handoffPath, "HANDOFF_MANIFEST.json"));
  const files = await Promise.all(
    manifest.files.map(async (file) => {
      const path = join(new RunStore(cwd).runPath(runId), file.path);
      if (!pathExists(path)) return { path: file.path, ok: false, reason: "missing" };
      const hash = await sha256File(path);
      return {
        path: file.path,
        ok: hash.sha256 === file.sha256 && hash.sizeBytes === file.sizeBytes,
        reason:
          hash.sha256 === file.sha256 && hash.sizeBytes === file.sizeBytes ? "ok" : "hash mismatch"
      };
    })
  );
  const ledger = await verifyLedger(cwd, runId).catch(() => undefined);
  return {
    runId,
    ok: files.every((file) => file.ok) && (ledger?.ok ?? false),
    ledgerStatus: ledger ? (ledger.ok ? "pass" : "fail") : "missing",
    files
  };
}

export async function archiveHandoffBundle(
  cwd: string,
  runId: string
): Promise<{ path: string; sha256: string }> {
  const store = new RunStore(cwd);
  const handoffPath = join(store.runPath(runId), "handoff");
  const archive: Record<string, string> = {};
  for (const entry of await readdir(handoffPath)) {
    if (!entry.startsWith("HANDOFF") && !entry.endsWith(".md") && !entry.endsWith(".json"))
      continue;
    archive[entry] = await readFile(join(handoffPath, entry), "utf8");
  }
  const archivePath = join(handoffPath, `vibecli-handoff-${runId}.tar.gz`);
  await writeFile(archivePath, await gzipAsync(JSON.stringify(archive, null, 2)));
  const hash = await sha256File(archivePath);
  await writeHandoffManifest(cwd, runId);
  return { path: archivePath, sha256: hash.sha256 };
}
