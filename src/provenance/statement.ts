import { writeLedgerManifest } from "../ledger/manifest.js";
import { RunStore } from "../orchestrator/run-store.js";
import { sha256Text } from "./signature.js";
import { collectProvenanceInputs, packageVersion } from "./collector.js";
import { updateProvenanceState } from "./state.js";
import type { ProvenanceStatement } from "./types.js";

export async function generateProvenanceStatement(
  cwd: string,
  runId: string
): Promise<ProvenanceStatement> {
  const store = new RunStore(cwd);
  const state = await store.readState(runId);
  const collected = await collectProvenanceInputs(cwd, runId);
  const statement: ProvenanceStatement = {
    version: 1,
    format: "slsa-inspired",
    runId,
    createdAt: new Date().toISOString(),
    subject: collected.subject.map((item) => ({
      name: item.name,
      digest: { sha256: item.sha256 }
    })),
    builder: { id: "vibecli", version: await packageVersion(cwd) },
    buildType: "vibecli.local.release",
    invocation: {
      promptHash: sha256Text(state.prompt),
      profile: null,
      policy: state.policy ?? null,
      routingStrategy: state.routingStrategy ?? null
    },
    materials: collected.materials.map((item) => ({
      uri: item.uri,
      digest: { sha256: item.sha256 }
    })),
    metadata: {
      repoRootHash: sha256Text(cwd),
      gitBranch: collected.gitBranch,
      gitCommit: collected.gitCommit,
      releaseChannel: collected.releaseSummary?.channel ?? state.release?.packet.channel ?? null,
      plannedVersion:
        collected.releaseSummary?.version.planned ?? state.release?.version.plannedVersion ?? null,
      tag: collected.releaseSummary?.git.tag ?? state.release?.tag.tag ?? null,
      verificationStatus: state.verification?.status ?? null,
      scannerStatus: state.scanners?.builtinStatus ?? null,
      ciStatus: collected.ci?.status ?? state.release?.ci.status ?? null,
      deploymentReadiness:
        collected.deployment?.verdict ?? state.release?.deploymentReadiness.verdict ?? null,
      releaseReadiness:
        collected.releaseReadiness?.verdict ?? state.release?.releaseReadiness.verdict ?? null
    },
    attestations: {
      ledgerVerified: collected.ledgerVerified,
      releasePacketVerified: collected.releasePacketVerified,
      handoffVerified: collected.handoffVerified,
      verificationPassed: state.verification?.status === "passed",
      scannerHighCriticalClear:
        !state.scanners || state.scanners.criticalFindings + state.scanners.highFindings === 0,
      ciPassed: collected.ci?.status === "passed",
      deploymentReady:
        collected.deployment?.verdict === "ready_to_deploy" ||
        collected.deployment?.verdict === "ready_with_warnings",
      releaseApprovalPresent: collected.releaseApprovalPresent
    },
    warnings: collected.warnings
  };
  await store.writeArtifact(runId, "provenance/provenance-statement.json", statement);
  await store.writeTextArtifact(runId, "provenance/PROVENANCE.md", renderProvenance(statement));
  await updateProvenanceState(store, runId, (provenance) => {
    provenance.statement = { status: "generated", generatedAt: statement.createdAt };
  });
  await writeLedgerManifest(cwd, runId);
  return statement;
}

export function renderProvenance(statement: ProvenanceStatement): string {
  return `# SLSA-Inspired Local Provenance

Run id: ${statement.runId}

Format: ${statement.format}

Statement: SLSA-inspired local provenance. This is not certified SLSA compliance.

Builder: ${statement.builder.id} ${statement.builder.version ?? "unknown"}

Git: ${statement.metadata.gitBranch ?? "unknown"} ${statement.metadata.gitCommit ?? "unknown"}

Release channel: ${statement.metadata.releaseChannel ?? "unknown"}

Planned version: ${statement.metadata.plannedVersion ?? "unknown"}

Attestations:
${Object.entries(statement.attestations)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join("\n")}

Warnings:
${statement.warnings.map((warning) => `- ${warning}`).join("\n") || "- none"}
`;
}
