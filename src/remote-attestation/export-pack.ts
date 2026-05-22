import { join } from "node:path";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { sha256File, sha256Text } from "../ledger/hash.js";
import { verifyLedger } from "../ledger/verify.js";
import { RunStore } from "../orchestrator/run-store.js";
import { readPolicyExceptions } from "../handoff/policy-exceptions.js";
import { currentBranch, gitHead, remoteOrigin } from "../git-lifecycle/status.js";
import { pathExists, readJson } from "../utils/fs.js";
import { updateRemoteAttestationState } from "./state.js";
import { redactAttestationJson, redactAttestationText } from "./redaction.js";
import type { AttestationExport, ExportManifest, RemotePayload } from "./types.js";

async function optionalJson<T>(path: string): Promise<T | undefined> {
  return pathExists(path) ? readJson<T>(path).catch(() => undefined) : undefined;
}

async function optionalHash(path: string): Promise<{ sha256: string; sizeBytes: number } | null> {
  return pathExists(path) ? sha256File(path) : null;
}

export async function createAttestationExport(
  cwd: string,
  runId: string
): Promise<AttestationExport> {
  const store = new RunStore(cwd);
  const runPath = store.runPath(runId);
  const state = await store.readState(runId);
  const releaseSummary = await optionalJson<{
    channel?: string;
    version?: { planned?: string | null };
    git?: { tag?: string | null };
  }>(join(runPath, "release", "RELEASE_SUMMARY.json"));
  const releaseReadiness = await optionalJson<{ verdict?: string }>(
    join(runPath, "release", "release-readiness.json")
  );
  const deploymentReadiness = await optionalJson<{ verdict?: string }>(
    join(runPath, "release", "deployment-readiness.json")
  );
  const ci = await optionalJson<{ status?: string }>(join(runPath, "release", "ci-status.json"));
  const envelope = await optionalJson<{
    signature?: { publicKeyFingerprint?: string };
    publicKey?: { fingerprint?: string };
  }>(join(runPath, "provenance", "provenance-envelope.json"));
  const evidence = await optionalJson<{
    archiveSha256?: string;
    signed?: boolean;
  }>(join(runPath, "evidence", "EVIDENCE_MANIFEST.json"));
  const checksums = await optionalJson<{
    entries?: Array<{ path: string; sha256: string; sizeBytes: number }>;
  }>(join(runPath, "provenance", "checksums.json"));
  const exceptions = await readPolicyExceptions(cwd, runId).catch(() => ({
    exceptions: []
  }));
  const ledger = await verifyLedger(cwd, runId).catch(() => undefined);
  const warnings: string[] = [];
  const statementHash = await optionalHash(
    join(runPath, "provenance", "provenance-statement.json")
  );
  const envelopeHash = await optionalHash(join(runPath, "provenance", "provenance-envelope.json"));
  const evidenceManifestHash = await optionalHash(
    join(runPath, "evidence", "EVIDENCE_MANIFEST.json")
  );
  const ledgerHash = await optionalHash(join(runPath, "ledger-manifest.json"));
  if (!envelopeHash) warnings.push("Signed provenance envelope is missing.");
  if (!evidenceManifestHash) warnings.push("Evidence bundle is missing.");
  if (!ledger?.ok) warnings.push("Ledger verification failed or ledger is missing.");
  const exportValue: AttestationExport = redactAttestationJson({
    version: 1,
    type: "vibecli.attestation.export",
    runId,
    createdAt: new Date().toISOString(),
    release: {
      channel: releaseSummary?.channel ?? state.release?.packet.channel ?? null,
      plannedVersion:
        releaseSummary?.version?.planned ?? state.release?.version.plannedVersion ?? null,
      tag: releaseSummary?.git?.tag ?? state.release?.tag.tag ?? null,
      releaseReadiness:
        releaseReadiness?.verdict ?? state.release?.releaseReadiness.verdict ?? null,
      deploymentReadiness:
        deploymentReadiness?.verdict ?? state.release?.deploymentReadiness.verdict ?? null
    },
    git: {
      branch: await currentBranch(cwd),
      commitSha: await gitHead(cwd),
      repositoryRemote: await remoteOrigin(cwd)
    },
    provenance: {
      statementSha256: statementHash?.sha256 ?? null,
      envelopeSha256: envelopeHash?.sha256 ?? null,
      signed: Boolean(envelopeHash),
      publicKeyFingerprint:
        envelope?.signature?.publicKeyFingerprint ?? envelope?.publicKey?.fingerprint ?? null
    },
    evidence: {
      archiveSha256: evidence?.archiveSha256 ?? null,
      manifestSha256: evidenceManifestHash?.sha256 ?? null,
      signed: Boolean(evidence?.signed)
    },
    ledger: { manifestSha256: ledgerHash?.sha256 ?? null, verified: ledger?.ok ?? false },
    verification: { status: state.verification?.status ?? null },
    scanners: {
      status: state.scanners
        ? `${state.scanners.builtinStatus}/${state.scanners.externalStatus}`
        : null,
      criticalFindings: state.scanners?.criticalFindings ?? 0,
      highFindings: state.scanners?.highFindings ?? 0
    },
    ci: { status: ci?.status ?? state.release?.ci.status ?? null },
    policy: {
      name: state.policy ?? null,
      exceptions: {
        open: exceptions.exceptions.filter((item) => item.status === "requested").length,
        approved: exceptions.exceptions.filter((item) => item.status === "approved").length,
        rejected: exceptions.exceptions.filter((item) => item.status === "rejected").length
      }
    },
    checksums: checksums?.entries ?? [],
    warnings
  });
  await store.writeArtifact(runId, "remote-attestation/ATTESTATION_EXPORT.json", exportValue);
  const exportHash = sha256Text(JSON.stringify(exportValue, null, 2) + "\n");
  const payload: RemotePayload = redactAttestationJson({
    version: 1,
    kind: "vibecli.remote-attestation",
    runId,
    createdAt: new Date().toISOString(),
    metadataOnly: true,
    attestationExportSha256: exportHash,
    provenanceEnvelopeSha256: exportValue.provenance.envelopeSha256,
    evidenceManifestSha256: exportValue.evidence.manifestSha256,
    ledgerManifestSha256: exportValue.ledger.manifestSha256,
    releaseReadiness: exportValue.release.releaseReadiness,
    deploymentReadiness: exportValue.release.deploymentReadiness,
    publicKeyFingerprint: exportValue.provenance.publicKeyFingerprint,
    warnings
  });
  await store.writeArtifact(runId, "remote-attestation/REMOTE_PAYLOAD.json", payload);
  await store.writeTextArtifact(
    runId,
    "remote-attestation/ATTESTATION_EXPORT.md",
    renderExport(exportValue)
  );
  await writeExportManifest(cwd, runId);
  await updateRemoteAttestationState(store, runId, (remote) => {
    remote.export = { status: "generated", generatedAt: exportValue.createdAt };
  });
  await writeLedgerManifest(cwd, runId);
  return exportValue;
}

export async function writeExportManifest(cwd: string, runId: string): Promise<ExportManifest> {
  const store = new RunStore(cwd);
  const runPath = store.runPath(runId);
  const files = [];
  for (const file of [
    "remote-attestation/ATTESTATION_EXPORT.json",
    "remote-attestation/ATTESTATION_EXPORT.md",
    "remote-attestation/REMOTE_PAYLOAD.json"
  ]) {
    const fullPath = join(runPath, file);
    if (pathExists(fullPath)) files.push({ path: file, ...(await sha256File(fullPath)) });
  }
  const base = { runId, createdAt: new Date().toISOString(), algorithm: "sha256" as const, files };
  const manifest = { ...base, manifestHash: sha256Text(JSON.stringify(base, null, 2)) };
  await store.writeArtifact(runId, "remote-attestation/EXPORT_MANIFEST.json", manifest);
  return manifest;
}

function renderExport(value: AttestationExport): string {
  return redactAttestationText(`# Attestation Export

Run id: ${value.runId}

Release readiness: ${value.release.releaseReadiness ?? "unknown"}

Deployment readiness: ${value.release.deploymentReadiness ?? "unknown"}

Signed provenance: ${value.provenance.signed}

Evidence signed: ${value.evidence.signed}

Ledger verified: ${value.ledger.verified}

Warnings:
${value.warnings.map((warning) => `- ${warning}`).join("\n") || "- none"}

No source files, private keys, evidence archives, registry artifacts, branches, tags, releases, deployments, or packages were uploaded.
`);
}
