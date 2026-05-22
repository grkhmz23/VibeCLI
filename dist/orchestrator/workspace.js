import { join } from "node:path";
import { agentRoleIds } from "../agents/roles.js";
import { estimateRunCost } from "../cost/estimate.js";
import { readLedgerManifest } from "../ledger/manifest.js";
import { pathExists, readJson } from "../utils/fs.js";
import { reviewRun } from "./diff.js";
import { RunStore } from "./run-store.js";
async function optionalJson(path, fallback) {
    return pathExists(path) ? readJson(path) : fallback;
}
export async function buildReviewWorkspace(cwd, runId, write = true) {
    const store = new RunStore(cwd);
    const state = await store.readState(runId);
    const runPath = store.runPath(runId);
    const repoContext = await optionalJson(join(runPath, "repo-context.json"), {});
    const manifest = await optionalJson(join(runPath, "patches", "manifest.json"), {
        runId,
        createdAt: new Date().toISOString(),
        patches: []
    });
    const review = await reviewRun(cwd, runId).catch(() => undefined);
    const commandReview = await optionalJson(join(runPath, "command-review.json"), { recommended: [] });
    const verification = await optionalJson(join(runPath, "verification-results.json"), {});
    const scannerResults = await optionalJson(join(runPath, "scanner-results.json"), []);
    const security = await optionalJson(join(runPath, "agent-outputs", "security.json"), {});
    const cost = await estimateRunCost(cwd, runId);
    const routingPlan = await optionalJson(join(runPath, "routing-plan.json"), {});
    const ledger = await readLedgerManifest(cwd, runId).catch(() => undefined);
    const workspace = {
        runId,
        createdAt: new Date().toISOString(),
        runStatus: state.status,
        approvalStatus: state.approval?.status ?? "not_required",
        applyStatus: state.apply?.status ?? "not_started",
        prompt: state.prompt,
        repoSummary: {
            repoRoot: repoContext.repoRoot ?? cwd,
            packageManager: repoContext.packageManager ?? "unknown",
            frameworks: repoContext.detectedFrameworks ?? [],
            currentBranch: null
        },
        agents: agentRoleIds.map((id) => ({
            id,
            status: state.agents[id]?.status ?? "queued",
            summary: state.agents[id]?.summary ?? null
        })),
        patches: manifest.patches.map((patch) => {
            const blocked = review?.filesAffected.find((file) => file.path === patch.path);
            return {
                agent: patch.agent,
                path: patch.path,
                operation: patch.operation,
                applied: patch.applied,
                blocked: blocked?.blocked ?? false,
                reason: blocked?.reason ?? null
            };
        }),
        commands: commandReview.recommended,
        security: {
            verdict: security.verdict ?? null,
            criticalFindings: security.findings?.filter((finding) => finding.severity === "critical").length ?? 0,
            highFindings: security.findings?.filter((finding) => finding.severity === "high").length ?? 0
        },
        verification: {
            status: verification.status ?? state.verification?.status ?? null,
            passed: verification.commands?.filter((command) => command.status === "passed").length ?? 0,
            failed: verification.commands?.filter((command) => command.status === "failed").length ?? 0,
            skipped: verification.commands?.filter((command) => command.status === "skipped").length ?? 0
        },
        scanners: {
            status: scannerResults.length
                ? scannerResults.map((scanner) => scanner.status).join(",")
                : null,
            criticalFindings: scannerResults
                .flatMap((scanner) => scanner.findings ?? [])
                .filter((finding) => finding.severity === "critical").length,
            highFindings: scannerResults
                .flatMap((scanner) => scanner.findings ?? [])
                .filter((finding) => finding.severity === "high").length,
            warnings: scannerResults
                .flatMap((scanner) => scanner.findings ?? [])
                .filter((finding) => finding.severity === "low" || finding.severity === "medium").length
        },
        cost: {
            known: cost.known,
            estimatedUsd: cost.estimatedUsd,
            totalTokens: cost.entries.reduce((sum, entry) => sum + (entry.totalTokens ?? 0), 0) || null
        },
        policy: state.policy ?? null,
        routing: {
            strategy: routingPlan.strategy ?? state.routingStrategy ?? null,
            agents: routingPlan.agents?.length ?? 0
        },
        ledger: {
            status: ledger ? "present" : "missing",
            entries: ledger?.entries.length ?? 0,
            manifestHash: ledger?.manifestHash ?? null
        },
        readiness: state.readiness?.verdict ?? null,
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
        audit: {
            activeSchema: state.audit?.schema.activeSchema ?? null,
            map: state.audit?.map.status ?? "not_started",
            coverage: state.audit?.coverage.status ?? "not_started",
            percentSatisfied: state.audit?.coverage.percentSatisfied ?? null,
            criticalMissing: state.audit?.coverage.criticalMissing ?? 0,
            highMissing: state.audit?.coverage.highMissing ?? 0,
            gaps: state.audit?.gaps.status ?? "not_started",
            p0: state.audit?.gaps.p0 ?? 0,
            p1: state.audit?.gaps.p1 ?? 0,
            export: state.audit?.export.status ?? "not_started",
            complianceBundle: state.audit?.complianceBundle.status ?? "not_started",
            reviewerDirectory: state.audit?.reviewerDirectory.status ?? "not_started",
            auditorHandoff: state.audit?.auditorHandoff.status ?? "not_started"
        },
        evidenceLifecycle: {
            inventory: state.evidenceLifecycle?.inventory.status ?? "not_started",
            totalFiles: state.evidenceLifecycle?.inventory.totalFiles ?? null,
            archive: state.evidenceLifecycle?.archive.status ?? "not_started",
            archivePath: state.evidenceLifecycle?.archive.archivePath ?? null,
            retentionLedger: state.evidenceLifecycle?.retentionLedger.status ?? "not_started",
            legalHold: state.evidenceLifecycle?.legalHold.status ?? "not_started",
            compaction: state.evidenceLifecycle?.compaction.status ?? "not_started",
            report: state.evidenceLifecycle?.report.status ?? "not_started"
        },
        evidenceDisposal: {
            eligibility: state.evidenceDisposal?.eligibility.status ?? "not_started",
            candidates: state.evidenceDisposal?.candidates.status ?? "not_started",
            plan: state.evidenceDisposal?.plan.status ?? "not_started",
            attestation: state.evidenceDisposal?.attestation.status ?? "not_started",
            approvals: state.evidenceDisposal?.approvals.status ?? "not_started",
            precheck: state.evidenceDisposal?.precheck.status ?? "not_started",
            execution: state.evidenceDisposal?.execution.status ?? "not_started"
        },
        nextActions: state.apply?.status === "applied"
            ? [`vibe verify ${runId} --confirm "VERIFY ${runId}"`, `vibe scan ${runId}`]
            : [`vibe review ${runId} --diff`, `vibe diff ${runId} --check`, `vibe approve ${runId}`]
    };
    if (write) {
        await store.writeArtifact(runId, "review-workspace.json", workspace);
        await store.writeTextArtifact(runId, "REVIEW_WORKSPACE.md", renderReviewWorkspaceMarkdown(workspace));
    }
    return workspace;
}
export function renderReviewWorkspaceMarkdown(workspace) {
    return `# VibeCLI Review Workspace

Run id: ${workspace.runId}

Prompt: ${workspace.prompt}

Status: ${workspace.runStatus}

Approval: ${workspace.approvalStatus}

Apply: ${workspace.applyStatus}

Policy: ${workspace.policy ?? "none"}

Routing: ${workspace.routing.strategy ?? "unknown"} (${workspace.routing.agents} agent routes)

Ledger: ${workspace.ledger.status} (${workspace.ledger.entries} entries)

Readiness: ${workspace.readiness ?? "unknown"}

Lifecycle: branch=${workspace.lifecycle.branch ?? "unknown"} commit=${workspace.lifecycle.commit} pr=${workspace.lifecycle.pr} merge=${workspace.lifecycle.mergeReadiness}

Release: packet=${workspace.release.packet} channel=${workspace.release.channel ?? "unknown"} changelog=${workspace.release.changelog} version=${workspace.release.version} branch=${workspace.release.releaseBranch} tag=${workspace.release.tag} ci=${workspace.release.ci} deploy=${workspace.release.deploymentReadiness} readiness=${workspace.release.releaseReadiness}

Provenance: key=${workspace.provenance.key} statement=${workspace.provenance.statement} signature=${workspace.provenance.signature} checksums=${workspace.provenance.checksums} evidence=${workspace.provenance.evidence} githubRelease=${workspace.provenance.githubReleaseDraft}

Remote attestation: export=${workspace.remoteAttestation.export} transparency=${workspace.remoteAttestation.transparency} submission=${workspace.remoteAttestation.submission} registry=${workspace.remoteAttestation.registryMetadata}

Organization: enabled=${workspace.organization.enabled} policyBundle=${workspace.organization.policyBundle} approvals=${workspace.organization.approvals} receiptRefresh=${workspace.organization.receiptRefresh} retention=${workspace.organization.retention} evidenceExport=${workspace.organization.evidenceExport} audit=${workspace.organization.audit} report=${workspace.organization.report}

Audit: schema=${workspace.audit.activeSchema ?? "none"} map=${workspace.audit.map} coverage=${workspace.audit.coverage} percent=${workspace.audit.percentSatisfied ?? "unknown"} criticalMissing=${workspace.audit.criticalMissing} highMissing=${workspace.audit.highMissing} gaps=${workspace.audit.gaps} export=${workspace.audit.export} compliance=${workspace.audit.complianceBundle} auditorHandoff=${workspace.audit.auditorHandoff}

Evidence lifecycle: inventory=${workspace.evidenceLifecycle.inventory} files=${workspace.evidenceLifecycle.totalFiles ?? "unknown"} archive=${workspace.evidenceLifecycle.archive} archivePath=${workspace.evidenceLifecycle.archivePath ?? "none"} retentionLedger=${workspace.evidenceLifecycle.retentionLedger} legalHold=${workspace.evidenceLifecycle.legalHold} compaction=${workspace.evidenceLifecycle.compaction} report=${workspace.evidenceLifecycle.report}

Evidence disposal: eligibility=${workspace.evidenceDisposal.eligibility} candidates=${workspace.evidenceDisposal.candidates} plan=${workspace.evidenceDisposal.plan} attestation=${workspace.evidenceDisposal.attestation} approvals=${workspace.evidenceDisposal.approvals} precheck=${workspace.evidenceDisposal.precheck} execution=${workspace.evidenceDisposal.execution}

## Patch Proposals

${workspace.patches.map((patch) => `- ${patch.path} (${patch.operation}) applied=${patch.applied} blocked=${patch.blocked}`).join("\n") || "- none"}

## Commands

${workspace.commands.map((command) => `- ${command.command}: ${command.classification}`).join("\n") || "- none"}

## Next Safe Actions

${workspace.nextActions.map((action) => `- ${action}`).join("\n")}
`;
}
//# sourceMappingURL=workspace.js.map