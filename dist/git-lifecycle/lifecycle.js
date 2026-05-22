import { join } from "node:path";
import { verifyLedger } from "../ledger/verify.js";
import { evaluateReadiness } from "../handoff/readiness.js";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists, readJson } from "../utils/fs.js";
import { currentBranch, remoteOrigin } from "./status.js";
export async function buildLifecycle(cwd, runId) {
    const store = new RunStore(cwd);
    const state = await store.readState(runId);
    const runPath = store.runPath(runId);
    const branchResult = pathExists(join(runPath, "git", "branch-result.json"))
        ? await readJson(join(runPath, "git", "branch-result.json"))
        : undefined;
    const commitResult = pathExists(join(runPath, "git", "commit-result.json"))
        ? await readJson(join(runPath, "git", "commit-result.json"))
        : undefined;
    const pr = pathExists(join(runPath, "github-pr.json"))
        ? await readJson(join(runPath, "github-pr.json"))
        : undefined;
    const ledger = await verifyLedger(cwd, runId).catch(() => undefined);
    const readiness = await evaluateReadiness(cwd, runId).catch(() => undefined);
    const current = await currentBranch(cwd);
    const lifecycle = {
        runId,
        createdAt: new Date().toISOString(),
        branch: {
            current,
            proposed: branchResult?.branch ?? state.lifecycle?.branch?.proposed ?? null,
            created: branchResult?.mode === "created" || branchResult?.mode === "switched_existing",
            protected: Boolean(current && ["main", "master", "production", "release"].includes(current))
        },
        apply: { status: state.apply.status, filesChanged: state.apply.filesChanged },
        commit: {
            status: commitResult?.mode === "created"
                ? "created"
                : (state.lifecycle?.commit?.status ?? "not_started"),
            commitSha: commitResult?.commitSha ?? state.lifecycle?.commit?.commitSha ?? null,
            subject: commitResult?.subject ?? null
        },
        github: {
            prStatus: pr?.mode ?? state.lifecycle?.pr?.status ?? null,
            prUrl: pr?.prUrl ?? state.lifecycle?.pr?.url ?? null,
            remote: await remoteOrigin(cwd)
        },
        verification: { status: state.verification?.status ?? null },
        scanners: {
            status: state.scanners
                ? `${state.scanners.builtinStatus}/${state.scanners.externalStatus}`
                : null,
            criticalFindings: state.scanners?.criticalFindings ?? 0,
            highFindings: state.scanners?.highFindings ?? 0
        },
        ledger: { status: ledger ? (ledger.ok ? "pass" : "fail") : "missing" },
        readiness: { verdict: readiness?.verdict ?? state.readiness?.verdict ?? null },
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
            approvals: state.organization?.approvals.status ?? "not_started",
            retention: state.organization?.retention.status ?? "not_started",
            evidenceExport: state.organization?.evidenceExport.status ?? "not_started",
            audit: state.organization?.audit.status ?? "not_started"
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
        nextActions: commitResult?.mode === "created"
            ? [`vibe github pr ${runId}`]
            : [`vibe commit-message ${runId}`, `vibe commit ${runId}`]
    };
    await store.writeArtifact(runId, "git/repository-lifecycle.json", lifecycle);
    await store.writeTextArtifact(runId, "git/REPOSITORY_LIFECYCLE.md", renderLifecycle(lifecycle));
    return lifecycle;
}
export function renderLifecycle(value) {
    return `# Repository Lifecycle

Run id: ${value.runId}

Branch: ${value.branch.current ?? "unknown"}

Commit: ${value.commit.status}${value.commit.commitSha ? ` ${value.commit.commitSha}` : ""}

PR: ${value.github.prStatus ?? "not_started"}

Readiness: ${value.readiness.verdict ?? "unknown"}

Release: packet=${value.release.packet} channel=${value.release.channel ?? "unknown"} changelog=${value.release.changelog} version=${value.release.version} branch=${value.release.releaseBranch} tag=${value.release.tag} ci=${value.release.ci} deploy=${value.release.deploymentReadiness} readiness=${value.release.releaseReadiness}

Provenance: statement=${value.provenance.statement} signature=${value.provenance.signature} checksums=${value.provenance.checksums} evidence=${value.provenance.evidence} githubRelease=${value.provenance.githubReleaseDraft}

Remote attestation: export=${value.remoteAttestation.export} transparency=${value.remoteAttestation.transparency} submission=${value.remoteAttestation.submission} registry=${value.remoteAttestation.registryMetadata}

Organization: enabled=${value.organization.enabled} approvals=${value.organization.approvals} retention=${value.organization.retention} evidenceExport=${value.organization.evidenceExport} audit=${value.organization.audit}

Evidence lifecycle: inventory=${value.evidenceLifecycle.inventory} archive=${value.evidenceLifecycle.archive} retentionLedger=${value.evidenceLifecycle.retentionLedger} legalHold=${value.evidenceLifecycle.legalHold} compaction=${value.evidenceLifecycle.compaction}

Evidence disposal: eligibility=${value.evidenceDisposal.eligibility} plan=${value.evidenceDisposal.plan} precheck=${value.evidenceDisposal.precheck} execution=${value.evidenceDisposal.execution}
`;
}
//# sourceMappingURL=lifecycle.js.map