import { join } from "node:path";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { sha256File } from "../ledger/hash.js";
import { gitHead, remoteOrigin } from "../git-lifecycle/status.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists, readJson } from "../utils/fs.js";
import { updateRemoteAttestationState } from "./state.js";
import { redactAttestationJson, redactAttestationText } from "./redaction.js";
import type { RegistryMetadata } from "./types.js";

const imagePattern = /^[a-z0-9][a-z0-9._/:/-]*$/;
const tagPattern = /^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$/;

export async function generateRegistryMetadata(
  cwd: string,
  runId: string,
  options: { image?: string; tag?: string } = {}
): Promise<RegistryMetadata> {
  if (options.image && !imagePattern.test(options.image)) throw new Error("Unsafe image name.");
  if (options.tag && !tagPattern.test(options.tag)) throw new Error("Unsafe image tag.");
  const store = new RunStore(cwd);
  const state = await store.readState(runId);
  const runPath = store.runPath(runId);
  const releaseSummary = pathExists(join(runPath, "release", "RELEASE_SUMMARY.json"))
    ? await readJson<{ version?: { planned?: string | null }; git?: { tag?: string | null } }>(
        join(runPath, "release", "RELEASE_SUMMARY.json")
      ).catch(() => undefined)
    : undefined;
  const provenanceEnvelope = pathExists(join(runPath, "provenance", "provenance-envelope.json"))
    ? await sha256File(join(runPath, "provenance", "provenance-envelope.json"))
    : null;
  const evidenceManifest = pathExists(join(runPath, "evidence", "EVIDENCE_MANIFEST.json"))
    ? await sha256File(join(runPath, "evidence", "EVIDENCE_MANIFEST.json"))
    : null;
  const ledgerManifest = pathExists(join(runPath, "ledger-manifest.json"))
    ? await sha256File(join(runPath, "ledger-manifest.json"))
    : null;
  const created = new Date().toISOString();
  const version = releaseSummary?.version?.planned ?? state.release?.version.plannedVersion ?? null;
  const tag = options.tag ?? releaseSummary?.git?.tag ?? state.release?.tag.tag ?? null;
  const revision = await gitHead(cwd);
  const source = await remoteOrigin(cwd);
  const metadata: RegistryMetadata = redactAttestationJson({
    runId,
    createdAt: created,
    format: "oci-inspired",
    image: {
      name: options.image ?? null,
      tag,
      version,
      revision,
      source,
      created
    },
    annotations: {
      "org.opencontainers.image.title": options.image ?? "vibecli-release-artifact",
      "org.opencontainers.image.description":
        "VibeCLI release metadata generated for manual operator use.",
      "org.opencontainers.image.version": version,
      "org.opencontainers.image.revision": revision,
      "org.opencontainers.image.source": source,
      "org.opencontainers.image.created": created,
      "dev.vibecli.run_id": runId,
      "dev.vibecli.release_readiness": state.release?.releaseReadiness.verdict ?? null,
      "dev.vibecli.provenance_envelope_sha256": provenanceEnvelope?.sha256 ?? null,
      "dev.vibecli.evidence_manifest_sha256": evidenceManifest?.sha256 ?? null,
      "dev.vibecli.ledger_manifest_sha256": ledgerManifest?.sha256 ?? null
    },
    warnings: [
      "Registry metadata is generated for manual/operator use only.",
      "VibeCLI Phase 11 does not push registry artifacts."
    ]
  });
  await store.writeArtifact(runId, "remote-attestation/REGISTRY_METADATA.json", metadata);
  await store.writeTextArtifact(
    runId,
    "remote-attestation/OCI_ANNOTATIONS.env",
    renderEnv(metadata)
  );
  await store.writeTextArtifact(
    runId,
    "remote-attestation/REGISTRY_METADATA.md",
    renderMetadata(metadata)
  );
  await updateRemoteAttestationState(store, runId, (remote) => {
    remote.registryMetadata = {
      status: "generated",
      image: options.image,
      tag: metadata.image.tag ?? undefined
    };
  });
  await writeLedgerManifest(cwd, runId);
  return metadata;
}

function renderEnv(metadata: RegistryMetadata): string {
  return Object.entries(metadata.annotations)
    .map(([key, value]) => `${key}=${shellEscape(value ?? "")}`)
    .join("\n")
    .concat("\n");
}

function shellEscape(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function renderMetadata(metadata: RegistryMetadata): string {
  return redactAttestationText(`# Registry Metadata

Run id: ${metadata.runId}

Image: ${metadata.image.name ?? "not set"}

Tag: ${metadata.image.tag ?? "not set"}

Format: ${metadata.format}

No Docker, ORAS, cosign, registry login, registry push, deployment, package publishing, branch push, or tag push was performed.
`);
}
