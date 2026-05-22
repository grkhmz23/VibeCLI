import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { RunStore } from "../orchestrator/run-store.js";
import { loadPrivateSigningKey, loadPublicSigningKey } from "./keyring.js";
import { signCanonicalJson, sha256Text } from "./signature.js";
import { generateProvenanceStatement } from "./statement.js";
import { updateProvenanceState } from "./state.js";
import type { ProvenanceEnvelope, ProvenanceStatement } from "./types.js";

export async function signProvenance(
  cwd: string,
  runId: string,
  options: { confirm?: string }
): Promise<ProvenanceEnvelope> {
  if (options.confirm !== `SIGN PROVENANCE ${runId}`) {
    throw new Error(`Provenance signing requires exact confirmation: SIGN PROVENANCE ${runId}`);
  }
  const store = new RunStore(cwd);
  const statement = await generateProvenanceStatement(cwd, runId);
  const privateKey = await loadPrivateSigningKey(cwd);
  const publicKey = await loadPublicSigningKey(cwd);
  const signatureBase64 = signCanonicalJson(statement, privateKey);
  const statementJson = await readFile(
    join(store.runPath(runId), "provenance", "provenance-statement.json"),
    "utf8"
  );
  const envelope: ProvenanceEnvelope = {
    version: 1,
    type: "vibecli.provenance.envelope",
    createdAt: new Date().toISOString(),
    runId,
    statementPath: "provenance/provenance-statement.json",
    statementSha256: sha256Text(statementJson),
    signature: {
      algorithm: "ed25519",
      signatureBase64,
      publicKeyFingerprint: publicKey.fingerprint
    },
    publicKey: { pem: publicKey.pem, fingerprint: publicKey.fingerprint }
  };
  await store.writeArtifact(runId, "provenance/provenance-envelope.json", envelope);
  await store.writeTextArtifact(runId, "provenance/provenance-signature.sig", signatureBase64);
  await store.writeTextArtifact(
    runId,
    "provenance/PROVENANCE_SIGNATURE.md",
    renderSignature(envelope)
  );
  await updateProvenanceState(store, runId, (provenance) => {
    provenance.key = { status: "present", publicKeyFingerprint: publicKey.fingerprint };
    provenance.signature = { status: "signed", signedAt: envelope.createdAt };
  });
  await writeLedgerManifest(cwd, runId);
  return envelope;
}

function renderSignature(envelope: ProvenanceEnvelope): string {
  return `# Provenance Signature

Run id: ${envelope.runId}

Algorithm: ${envelope.signature.algorithm}

Public key fingerprint: ${envelope.signature.publicKeyFingerprint}

Statement path: ${envelope.statementPath}

Statement sha256: ${envelope.statementSha256}

Local signatures are local integrity evidence, not legal identity proof or remote attestation.
`;
}

export type { ProvenanceStatement };
