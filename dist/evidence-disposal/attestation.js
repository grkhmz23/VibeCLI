import { join } from "node:path";
import { chooseAuditSigningKey } from "../audit/sign.js";
import { sha256File, sha256Text } from "../ledger/hash.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { canonicalJson, signCanonicalJson } from "../provenance/signature.js";
import { appendRetentionLedgerEvent } from "../evidence-lifecycle/retention-ledger.js";
import { RunStore } from "../orchestrator/run-store.js";
import { createDisposalPlan } from "./plan.js";
import { updateEvidenceDisposalState } from "./state.js";
export async function createDisposalAttestation(cwd, runId, options = {}) {
    if (options.sign && options.confirm !== `SIGN DISPOSAL ATTESTATION ${runId}`) {
        throw new Error(`Disposal attestation signing requires exact confirmation: SIGN DISPOSAL ATTESTATION ${runId}`);
    }
    const store = new RunStore(cwd);
    const runPath = store.runPath(runId);
    const plan = await createDisposalPlan(cwd, runId, { forcePreview: true });
    const planHash = await sha256File(join(runPath, "evidence-lifecycle", "disposal", "DISPOSAL_PLAN.json"));
    const payload = {
        version: 1,
        type: "vibecli.disposal.attestation",
        runId,
        createdAt: new Date().toISOString(),
        planSha256: planHash.sha256,
        candidateCount: plan.estimatedFilesToDelete,
        candidateBytes: plan.estimatedBytesToDelete,
        blockedCount: plan.blocked.length,
        scope: "run-evidence-only",
        preDeleteRequirementsSatisfied: plan.preDeleteRequirements.every((requirement) => !requirement.required ||
            requirement.satisfied ||
            requirement.name === "disposal_attestation"),
        legalHold: plan.preDeleteRequirements.some((requirement) => requirement.name === "no_legal_hold" && !requirement.satisfied),
        archiveVerified: plan.preDeleteRequirements.some((requirement) => requirement.name === "archive_verified" && requirement.satisfied),
        ledgerVerified: plan.preDeleteRequirements.some((requirement) => requirement.name === "ledger_verified" && requirement.satisfied),
        warnings: ["Local disposal attestation only. No evidence was deleted or submitted remotely."]
    };
    const key = options.sign ? await chooseAuditSigningKey(cwd) : undefined;
    const attestation = {
        ...payload,
        signature: key
            ? {
                algorithm: "ed25519",
                publicKeyFingerprint: key.publicFingerprint,
                payloadHash: sha256Text(canonicalJson(payload)),
                signatureBase64: signCanonicalJson(payload, key.privateKey)
            }
            : {
                algorithm: "sha256-local",
                publicKeyFingerprint: null,
                payloadHash: sha256Text(canonicalJson(payload)),
                signatureBase64: null
            }
    };
    await store.writeArtifact(runId, "evidence-lifecycle/disposal/DISPOSAL_ATTESTATION.json", attestation);
    await store.writeTextArtifact(runId, "evidence-lifecycle/disposal/DISPOSAL_ATTESTATION.md", renderAttestation(attestation));
    await updateEvidenceDisposalState(store, runId, (state) => {
        state.attestation = { status: options.sign ? "signed" : "generated" };
    });
    await writeLedgerManifest(cwd, runId).catch(() => undefined);
    await appendRetentionLedgerEvent(cwd, {
        eventType: "disposal_attestation_created",
        runId,
        actor: null,
        summary: options.sign
            ? "Signed disposal attestation created."
            : "Disposal attestation created.",
        artifactHashes: [
            {
                path: `.vibecli/runs/${runId}/evidence-lifecycle/disposal/DISPOSAL_PLAN.json`,
                sha256: planHash.sha256
            }
        ]
    }).catch(() => undefined);
    return attestation;
}
function renderAttestation(attestation) {
    return `# Disposal Attestation

Run id: ${attestation.runId}
Candidates: ${attestation.candidateCount}
Candidate bytes: ${attestation.candidateBytes}
Scope: ${attestation.scope}
Signature: ${attestation.signature.algorithm}

No evidence was deleted.
`;
}
//# sourceMappingURL=attestation.js.map