import { join } from "node:path";
import { loadConfig } from "../config/config.js";
import { writeLedgerManifest } from "../ledger/manifest.js";
import { RunStore } from "../orchestrator/run-store.js";
import { readRemoteSubmissionReceipt } from "../remote-attestation/receipt.js";
import { readReceiptVerification } from "../remote-attestation/receipt-refresh.js";
import { pathExists, readJson } from "../utils/fs.js";
import { verifyOrgAuditLog } from "./audit-log.js";
import { getApprovalMatrix } from "./approval-matrix.js";
import { verifyEvidenceExport } from "./evidence-export-policy.js";
import { verifyOrgPolicyBundle } from "./policy-bundle.js";
import { readRetentionPlan } from "./retention.js";
import { updateOrganizationState } from "./state.js";
export async function createOrgAuditReport(cwd, runId) {
    const config = await loadConfig(cwd);
    const store = new RunStore(cwd);
    const policyBundle = await verifyOrgPolicyBundle(cwd).catch(() => undefined);
    const approvals = await getApprovalMatrix(cwd, runId).catch(() => undefined);
    const receipt = await readRemoteSubmissionReceipt(cwd, runId);
    const receiptVerification = await readReceiptVerification(cwd, runId);
    const retention = await readRetentionPlan(cwd, runId);
    const evidenceManifestPath = join(store.runPath(runId), "org", "exports", "EVIDENCE_EXPORT_MANIFEST.json");
    const evidenceManifest = pathExists(evidenceManifestPath)
        ? await readJson(evidenceManifestPath).catch(() => undefined)
        : undefined;
    const evidenceVerify = evidenceManifest
        ? await verifyEvidenceExport(cwd, runId).catch(() => undefined)
        : undefined;
    const audit = await verifyOrgAuditLog(cwd).catch(() => undefined);
    const state = await store.readState(runId);
    const report = {
        runId,
        createdAt: new Date().toISOString(),
        org: {
            orgId: config.organization.enabled ? config.organization.org_id : null,
            orgName: config.organization.enabled ? config.organization.org_name : null
        },
        policyBundle: {
            present: Boolean(policyBundle),
            signed: Boolean(policyBundle?.fingerprint),
            verified: policyBundle?.ok ?? false,
            fingerprint: policyBundle?.fingerprint ?? null
        },
        approvals: {
            quorumStatus: approvals?.quorum.status ?? "not_started",
            approvedCount: approvals?.quorum.approvedCount ?? 0,
            missingRoles: approvals?.quorum.missingRoles ?? []
        },
        remoteReceipt: {
            submitted: Boolean(receipt?.submitted),
            verified: receiptVerification?.verified ?? false,
            receiptId: receipt?.remoteReceiptId ?? null,
            remoteUrl: receipt?.remoteUrl ?? null
        },
        retention: {
            policy: retention?.policy ?? null,
            marked: pathExists(join(store.runPath(runId), "org", "RETENTION_MARKER.json")),
            retainUntil: retention?.retainUntil ?? null,
            legalHold: retention?.legalHold ?? false
        },
        evidenceExport: {
            present: Boolean(evidenceManifest),
            mode: evidenceManifest?.mode ?? null,
            verified: evidenceVerify?.ok ?? false
        },
        evidenceLifecycle: {
            inventory: state.evidenceLifecycle?.inventory.status ?? "not_started",
            archive: state.evidenceLifecycle?.archive.status ?? "not_started",
            retentionLedger: state.evidenceLifecycle?.retentionLedger.status ?? "not_started",
            legalHold: state.evidenceLifecycle?.legalHold.status ?? "not_started",
            compaction: state.evidenceLifecycle?.compaction.status ?? "not_started"
        },
        evidenceDisposal: {
            eligibility: state.evidenceDisposal?.eligibility.status ?? "not_started",
            plan: state.evidenceDisposal?.plan.status ?? "not_started",
            precheck: state.evidenceDisposal?.precheck.status ?? "not_started",
            execution: state.evidenceDisposal?.execution.status ?? "not_started"
        },
        auditLog: {
            verified: audit?.ok ?? false,
            eventCount: audit?.eventCount ?? 0,
            latestChainHash: audit?.latestChainHash ?? null
        },
        readiness: {
            releaseReadiness: state.release?.releaseReadiness.verdict ?? null,
            deploymentReadiness: state.release?.deploymentReadiness.verdict ?? null
        },
        warnings: [],
        blockingReasons: [],
        nextActions: [`vibe org audit --verify`, `vibe ledger ${runId} --verify`]
    };
    await store.writeArtifact(runId, "org/ORG_AUDIT_REPORT.json", report);
    await store.writeTextArtifact(runId, "org/ORG_AUDIT_REPORT.md", renderOrgReport(report));
    await updateOrganizationState(store, runId, (org) => {
        org.report = { status: "generated" };
    });
    await writeLedgerManifest(cwd, runId);
    return report;
}
function renderOrgReport(report) {
    return `# Organization Audit Report

Run: ${report.runId}
Org: ${report.org.orgId ?? "not enabled"}

Policy bundle verified: ${report.policyBundle.verified}
Approval quorum: ${report.approvals.quorumStatus}
Receipt verified: ${report.remoteReceipt.verified}
Retention marked: ${report.retention.marked}
Evidence export verified: ${report.evidenceExport.verified}
Evidence lifecycle: inventory=${report.evidenceLifecycle?.inventory ?? "not_started"} archive=${report.evidenceLifecycle?.archive ?? "not_started"} retentionLedger=${report.evidenceLifecycle?.retentionLedger ?? "not_started"} legalHold=${report.evidenceLifecycle?.legalHold ?? "not_started"} compaction=${report.evidenceLifecycle?.compaction ?? "not_started"}
Evidence disposal: eligibility=${report.evidenceDisposal?.eligibility ?? "not_started"} plan=${report.evidenceDisposal?.plan ?? "not_started"} precheck=${report.evidenceDisposal?.precheck ?? "not_started"} execution=${report.evidenceDisposal?.execution ?? "not_started"}
Audit log verified: ${report.auditLog.verified}
`;
}
//# sourceMappingURL=audit-report.js.map