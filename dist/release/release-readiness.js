import { join } from "node:path";
import { verifyLedger } from "../ledger/verify.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { readApprovalNotes } from "../approvals/notes.js";
import { readPolicyExceptions } from "../handoff/policy-exceptions.js";
import { loadPolicyProfile } from "../policies/profile-loader.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists, readJson } from "../utils/fs.js";
import { readCiStatus } from "./ci.js";
import { updateReleaseState } from "./state.js";
import { loadConfig } from "../config/config.js";
import { getApprovalMatrix } from "../org/approval-matrix.js";
export async function evaluateReleaseReadiness(cwd, runId, options = {}) {
    const channel = options.channel ?? "internal";
    const store = new RunStore(cwd);
    const state = await store.readState(runId);
    const summary = await readJson(join(store.runPath(runId), "release", "RELEASE_SUMMARY.json")).catch(() => undefined);
    const deployment = await readJson(join(store.runPath(runId), "release", "deployment-readiness.json")).catch(() => undefined);
    const ledger = await verifyLedger(cwd, runId).catch(() => undefined);
    const ci = await readCiStatus(cwd, runId);
    const notes = await readApprovalNotes(cwd, runId);
    const policy = state.policy
        ? await loadPolicyProfile(cwd, state.policy).catch(() => undefined)
        : undefined;
    const exceptions = await readPolicyExceptions(cwd, runId).catch(() => ({
        runId,
        createdAt: new Date().toISOString(),
        exceptions: []
    }));
    const config = await loadConfig(cwd);
    const blockingReasons = [];
    const warnings = [];
    const passed = [];
    if (!summary)
        blockingReasons.push("Release packet is missing.");
    if (ledger?.ok)
        passed.push("ledger pass");
    else if (channel === "production")
        blockingReasons.push("Production requires ledger pass.");
    else
        warnings.push("Ledger is missing or failed.");
    if (state.verification?.status === "passed")
        passed.push("verification passed");
    else if (channel === "production")
        blockingReasons.push("Production requires verification pass.");
    else
        warnings.push("Verification is not passed.");
    if (ci?.status === "passed")
        passed.push("CI passed");
    else if (channel === "production")
        blockingReasons.push("Production requires CI pass.");
    else
        warnings.push("CI is not passed or not ingested.");
    if (deployment?.verdict === "ready_to_deploy" || deployment?.verdict === "ready_with_warnings") {
        passed.push("deployment readiness evaluated");
        warnings.push(...deployment.warnings);
    }
    else if (channel === "production") {
        blockingReasons.push("Production requires deployment readiness.");
    }
    else {
        warnings.push("Deployment readiness is missing or blocked.");
    }
    if (state.scanners && state.scanners.criticalFindings + state.scanners.highFindings > 0) {
        blockingReasons.push("Scanner high/critical findings exist.");
    }
    const unresolved = exceptions.exceptions.filter((item) => (item.severity === "critical" || item.severity === "high") && item.status !== "approved");
    if (unresolved.length)
        blockingReasons.push("Unresolved high/critical policy exceptions exist.");
    if (state.apply.status === "applied" &&
        !pathExists(join(store.runPath(runId), "rollback", "pre-apply-metadata.json"))) {
        blockingReasons.push("Rollback plan is missing after source changes.");
    }
    const releaseApproved = notes.some((note) => note.type === "release" && note.decision === "approved");
    if (channel === "production" && state.policy === "strict-enterprise" && !releaseApproved) {
        blockingReasons.push("strict-enterprise production release requires release approval.");
    }
    const provenanceRequired = policy?.provenance.require_signed_provenance ||
        (channel === "production" && state.policy === "company-grade");
    if (policy?.provenance.require_provenance_statement) {
        if (!pathExists(join(store.runPath(runId), "provenance", "provenance-statement.json"))) {
            if (channel === "production")
                blockingReasons.push("Production requires provenance statement.");
            else
                warnings.push("Provenance statement is missing.");
        }
        else {
            passed.push("provenance statement present");
        }
    }
    if (provenanceRequired) {
        const signatureStatus = state.provenance?.signature.status;
        if (signatureStatus === "verified" || signatureStatus === "signed") {
            passed.push("signed provenance present");
        }
        else if (channel === "production") {
            blockingReasons.push("Production requires signed provenance.");
        }
        else {
            warnings.push("Signed provenance is missing.");
        }
    }
    if (channel === "production" &&
        policy?.provenance.require_signed_evidence_for_release &&
        state.provenance?.evidence.status !== "signed" &&
        state.provenance?.evidence.status !== "verified") {
        blockingReasons.push("Production requires signed evidence bundle.");
    }
    if (policy?.remote_attestation.require_transparency_entry_for_submission) {
        const transparencyOk = state.remoteAttestation?.transparency.status === "appended" ||
            state.remoteAttestation?.transparency.status === "verified";
        if (transparencyOk)
            passed.push("transparency entry present");
        else if (channel === "production")
            blockingReasons.push("Production requires transparency entry.");
        else
            warnings.push("Transparency entry is missing.");
    }
    if (policy?.registry_metadata.require_registry_metadata_for_release) {
        const registryOk = state.remoteAttestation?.registryMetadata.status === "generated";
        if (registryOk)
            passed.push("registry metadata generated");
        else if (channel === "production") {
            blockingReasons.push("Production requires registry metadata.");
        }
        else {
            warnings.push("Registry metadata is missing.");
        }
    }
    if (policy?.audit.require_signed_audit_export_for_production) {
        const auditSigned = state.audit?.export.status === "signed" || state.audit?.export.status === "verified";
        if (auditSigned)
            passed.push("signed audit export present");
        else if (channel === "production") {
            blockingReasons.push("Production requires signed audit export.");
        }
        else {
            warnings.push("Signed audit export is missing.");
        }
    }
    const matrix = await getApprovalMatrix(cwd, runId).catch(() => undefined);
    const orgApprovalRequired = config.organization.require_multi_reviewer_approval_for_release ||
        (channel === "production" && state.policy === "strict-enterprise");
    const orgApprovalStatus = !orgApprovalRequired
        ? matrix
            ? matrix.quorum.status
            : "not_required"
        : matrix
            ? matrix.quorum.status
            : "not_started";
    if (orgApprovalRequired && orgApprovalStatus !== "met") {
        blockingReasons.push("Organization approval quorum is required.");
    }
    else if (channel === "production" &&
        state.policy === "company-grade" &&
        matrix?.quorum.status !== "met") {
        warnings.push("Organization approval quorum is not met.");
    }
    const result = {
        runId,
        createdAt: new Date().toISOString(),
        channel,
        verdict: blockingReasons.length > 0
            ? "blocked"
            : warnings.length > 0
                ? "ready_with_warnings"
                : "ready_to_release",
        blockingReasons,
        warnings,
        passed,
        requiredApprovals: channel === "production" ? ["release approval"] : [],
        orgApproval: {
            status: orgApprovalStatus === "met"
                ? "met"
                : orgApprovalStatus === "blocked"
                    ? "blocked"
                    : orgApprovalStatus === "not_required"
                        ? "not_required"
                        : orgApprovalStatus === "not_started"
                            ? "not_started"
                            : "not_met",
            approvalPolicy: matrix?.approvalPolicy ?? null,
            approvedCount: matrix?.quorum.approvedCount ?? 0,
            missingRoles: matrix?.quorum.missingRoles ?? [],
            blockingReasons: matrix?.quorum.blockingReasons ?? []
        },
        nextActions: [`vibe tag ${runId}`, `vibe release-approval ${runId}`]
    };
    await store.writeArtifact(runId, "release/release-readiness.json", result);
    await store.writeTextArtifact(runId, "release/RELEASE_READINESS.md", renderReleaseReadiness(result));
    await updateReleaseState(store, runId, (release) => {
        release.releaseReadiness = { verdict: result.verdict };
    });
    await writeLedgerManifest(cwd, runId);
    return result;
}
export function renderReleaseReadiness(value) {
    return `# Release Readiness

Channel: ${value.channel}

Verdict: ${value.verdict}

Blocking reasons:
${value.blockingReasons.map((reason) => `- ${reason}`).join("\n") || "- none"}

Warnings:
${value.warnings.map((warning) => `- ${warning}`).join("\n") || "- none"}

Passed:
${value.passed.map((item) => `- ${item}`).join("\n") || "- none"}
`;
}
//# sourceMappingURL=release-readiness.js.map