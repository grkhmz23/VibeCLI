import { join } from "node:path";
import { loadConfig } from "../config/config.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { sha256Text } from "../ledger/hash.js";
import { verifyLedger } from "../ledger/verify.js";
import { loadPolicyProfile } from "../policies/profile-loader.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists, readJson } from "../utils/fs.js";
import { createAttestationExport } from "./export-pack.js";
import { postJson } from "./http-client.js";
import { parseRemoteReceipt } from "./receipt.js";
import { updateRemoteAttestationState } from "./state.js";
import { redactAttestationText } from "./redaction.js";
export async function submitAttestation(cwd, runId, options) {
    const targetName = options.target ?? "";
    if (!options.dryRun && options.confirm !== `SUBMIT ATTESTATION ${runId} TO ${targetName}`) {
        throw new Error(`Remote attestation submission requires exact confirmation: SUBMIT ATTESTATION ${runId} TO ${targetName}`);
    }
    const config = await loadConfig(cwd);
    const store = new RunStore(cwd);
    const state = await store.readState(runId);
    const target = targetName ? config.remote_attestation.targets[targetName] : undefined;
    if (!pathExists(join(store.runPath(runId), "remote-attestation", "REMOTE_PAYLOAD.json"))) {
        await createAttestationExport(cwd, runId);
    }
    const payload = await readJson(join(store.runPath(runId), "remote-attestation", "REMOTE_PAYLOAD.json"));
    const requestText = JSON.stringify(payload, null, 2);
    const warnings = [];
    const errors = [];
    if (!targetName)
        errors.push("Target is required.");
    if (!target)
        errors.push(`Remote attestation target ${targetName || "unknown"} is missing.`);
    if (target && !target.enabled)
        errors.push(`Remote attestation target ${targetName} is disabled.`);
    if (!config.remote_attestation.allow_remote_submission &&
        !options.allowConfigDisabled &&
        !options.dryRun) {
        errors.push("remote_attestation.allow_remote_submission is false.");
    }
    const policy = state.policy
        ? await loadPolicyProfile(cwd, state.policy).catch(() => undefined)
        : undefined;
    const signedRequired = config.remote_attestation.require_signed_provenance ||
        policy?.remote_attestation.require_signed_provenance_for_submission;
    if (signedRequired &&
        state.provenance?.signature.status !== "signed" &&
        state.provenance?.signature.status !== "verified") {
        errors.push("Signed provenance is required for remote submission.");
    }
    const evidenceRequired = config.remote_attestation.require_evidence_bundle ||
        policy?.remote_attestation.require_evidence_bundle_for_submission;
    if (evidenceRequired &&
        state.provenance?.evidence.status !== "generated" &&
        state.provenance?.evidence.status !== "signed" &&
        state.provenance?.evidence.status !== "verified") {
        errors.push("Evidence bundle is required for remote submission.");
    }
    if (policy?.remote_attestation.require_transparency_entry_for_submission &&
        state.remoteAttestation?.transparency.status !== "appended") {
        errors.push("Transparency entry append is required for remote submission.");
    }
    const ledger = await verifyLedger(cwd, runId).catch(() => undefined);
    if ((config.remote_attestation.require_ledger_pass ||
        policy?.remote_attestation.require_ledger_pass_for_submission) &&
        !options.allowLedgerWarning &&
        !ledger?.ok) {
        errors.push("Ledger verification is required for remote submission.");
    }
    if (Buffer.byteLength(requestText) > config.remote_attestation.max_payload_bytes) {
        errors.push("Remote attestation payload exceeds max_payload_bytes.");
    }
    let statusCode = null;
    let responseSha256 = null;
    let remoteReceiptId = null;
    let remoteUrl = null;
    let submitted = false;
    if (options.dryRun) {
        warnings.push("Dry run only; no remote endpoint was called.");
    }
    else if (errors.length === 0 && target) {
        const token = target.token_env ? process.env[target.token_env] : undefined;
        if (target.token_env && !token)
            errors.push(`Remote target token env ${target.token_env} is not set.`);
        if (errors.length === 0) {
            const transport = options.post ?? postJson;
            const response = await transport(target.url, payload, {
                ...(target.headers ?? {}),
                ...(token ? { authorization: `Bearer ${token}` } : {})
            }, config.remote_attestation.request_timeout_ms);
            statusCode = response.statusCode;
            responseSha256 = sha256Text(response.body);
            const parsed = parseRemoteReceipt(response.body);
            remoteReceiptId = parsed.remoteReceiptId;
            remoteUrl = parsed.remoteUrl;
            submitted = response.statusCode >= 200 && response.statusCode < 300;
            if (!submitted)
                errors.push(`Remote target returned HTTP ${response.statusCode}.`);
        }
    }
    const receipt = {
        runId,
        createdAt: new Date().toISOString(),
        target: targetName || "unknown",
        targetType: "generic-http",
        targetHost: target ? new URL(target.url).host : "unknown",
        submitted,
        statusCode,
        requestSha256: sha256Text(requestText),
        responseSha256,
        remoteReceiptId,
        remoteUrl,
        warnings,
        errors
    };
    const artifactName = options.dryRun
        ? "remote-attestation/REMOTE_SUBMISSION_DRY_RUN.json"
        : "remote-attestation/REMOTE_SUBMISSION_RECEIPT.json";
    await store.writeArtifact(runId, artifactName, receipt);
    await store.writeTextArtifact(runId, "remote-attestation/REMOTE_SUBMISSION.md", renderReceipt(receipt));
    await updateRemoteAttestationState(store, runId, (remote) => {
        remote.submission = {
            status: options.dryRun
                ? "dry_run"
                : submitted
                    ? "submitted"
                    : errors.length
                        ? "blocked"
                        : "failed",
            target: targetName || undefined,
            submittedAt: submitted ? receipt.createdAt : undefined,
            receiptId: remoteReceiptId ?? undefined,
            remoteUrl: remoteUrl ?? undefined
        };
    });
    await writeLedgerManifest(cwd, runId);
    return receipt;
}
function renderReceipt(receipt) {
    return redactAttestationText(`# Remote Attestation Submission

Target: ${receipt.target}

Submitted: ${receipt.submitted}

Status code: ${receipt.statusCode ?? "none"}

Remote receipt: ${receipt.remoteReceiptId ?? "none"}

Remote URL: ${receipt.remoteUrl ?? "none"}

Warnings:
${receipt.warnings.map((warning) => `- ${warning}`).join("\n") || "- none"}

Errors:
${receipt.errors.map((error) => `- ${error}`).join("\n") || "- none"}

No source code, evidence archive, private key, registry artifact, branch, tag, release, deployment, or package was uploaded.
`);
}
//# sourceMappingURL=submit.js.map