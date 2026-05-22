import type { AgentRoleId } from "../agents/roles.js";
export type RunStatus = "created" | "running" | "completed" | "completed_with_pending_approval" | "failed" | "rejected";
export type AgentStatus = "queued" | "running" | "passed" | "failed" | "skipped";
export type GateStatus = "not_started" | "running" | "passed" | "failed" | "requires_repair";
export type AgentState = {
    id: AgentRoleId;
    status: AgentStatus;
    startedAt?: string;
    completedAt?: string;
    artifacts: string[];
    summary?: string;
};
export type GateState = {
    agent: AgentRoleId;
    status: GateStatus;
    condition: string;
    message?: string;
};
export type RunEvent = {
    timestamp: string;
    agent?: AgentRoleId;
    type: string;
    message: string;
};
export type ApprovalState = {
    status: "not_required" | "pending" | "approved_for_future_phase" | "approved" | "rejected";
    approvedAt?: string;
    rejectedAt?: string;
};
export type ApplyState = {
    status: "not_started" | "dry_run_passed" | "dry_run_failed" | "applied" | "failed" | "rolled_back";
    appliedAt?: string;
    rolledBackAt?: string;
    filesChanged: string[];
};
export type RunState = {
    runId: string;
    prompt: string;
    repoPath: string;
    status: RunStatus;
    currentAgent?: AgentRoleId;
    createdAt: string;
    updatedAt: string;
    agents: Record<AgentRoleId, AgentState>;
    gates: Record<AgentRoleId, GateState>;
    artifactsPath: string;
    events: RunEvent[];
    approval: ApprovalState;
    apply: ApplyState;
    verification?: {
        status: "not_started" | "passed" | "failed" | "skipped";
        verifiedAt?: string;
        failedCommands: string[];
    };
    scanners?: {
        builtinStatus: "not_started" | "passed" | "failed" | "warning" | "skipped";
        externalStatus: "not_started" | "passed" | "failed" | "warning" | "skipped";
        criticalFindings: number;
        highFindings: number;
    };
    repair?: {
        status: "not_started" | "not_required" | "proposed" | "failed" | "max_cycles_reached";
        cyclesUsed: number;
        latestCycle?: number;
    };
    policy?: string;
    routingStrategy?: string;
    budget?: {
        status: "within_budget" | "warning" | "blocked" | "exceeded" | "unknown";
        maxRunCostUsd: number | null;
    };
    ledger?: {
        status: "not_started" | "valid" | "invalid" | "unknown";
        manifestHash?: string;
    };
    readiness?: {
        verdict: "ready_for_pr" | "ready_with_warnings" | "blocked" | "not_applied";
        checkedAt: string;
    };
    lifecycle?: {
        branch: {
            proposed: string | null;
            current: string | null;
            created: boolean;
            createdAt?: string;
        };
        commit: {
            status: "not_started" | "previewed" | "created" | "failed";
            commitSha?: string;
            committedAt?: string;
        };
        pr: {
            status: "not_started" | "dry_summary" | "created" | "updated" | "commented" | "sync_failed" | "failed";
            url?: string;
            updatedAt?: string;
        };
        feedback: {
            status: "not_started" | "ingested" | "failed";
            ingestedAt?: string;
        };
        mergeReadiness: {
            verdict: "not_started" | "ready_to_merge" | "ready_with_warnings" | "blocked" | "not_ready";
            checkedAt?: string;
        };
    };
    release?: ReleaseState;
    provenance?: ProvenanceState;
    remoteAttestation?: RemoteAttestationState;
    organization?: OrganizationState;
    audit?: AuditState;
    evidenceLifecycle?: EvidenceLifecycleState;
    evidenceDisposal?: EvidenceDisposalState;
    phase?: number;
    mode?: "dry-run" | "live";
};
export type ReleaseState = {
    packet: {
        status: "not_started" | "generated" | "failed";
        channel?: string;
        generatedAt?: string;
    };
    changelog: {
        status: "not_started" | "previewed" | "written" | "failed";
        path?: string;
    };
    version: {
        status: "not_started" | "planned" | "applied" | "failed";
        currentVersion?: string;
        plannedVersion?: string;
    };
    releaseBranch: {
        status: "not_started" | "previewed" | "created" | "failed";
        branch?: string;
    };
    tag: {
        status: "not_started" | "previewed" | "created" | "deleted" | "failed";
        tag?: string;
    };
    ci: {
        status: "not_started" | "passed" | "failed" | "pending" | "unknown";
    };
    deploymentReadiness: {
        verdict: "not_started" | "ready_to_deploy" | "ready_with_warnings" | "blocked" | "not_ready";
    };
    releaseReadiness: {
        verdict: "not_started" | "ready_to_release" | "ready_with_warnings" | "blocked" | "not_ready";
    };
};
export type ProvenanceState = {
    key: {
        status: "unknown" | "missing" | "present";
        publicKeyFingerprint?: string;
    };
    statement: {
        status: "not_started" | "generated" | "failed";
        generatedAt?: string;
    };
    signature: {
        status: "not_started" | "signed" | "failed" | "verified" | "invalid";
        signedAt?: string;
        verifiedAt?: string;
    };
    checksums: {
        status: "not_started" | "generated" | "verified" | "invalid" | "failed";
    };
    evidence: {
        status: "not_started" | "generated" | "signed" | "verified" | "invalid" | "failed";
        archivePath?: string;
    };
    githubReleaseDraft: {
        status: "not_started" | "previewed" | "draft_created" | "updated" | "failed";
        url?: string;
    };
};
export type RemoteAttestationState = {
    export: {
        status: "not_started" | "generated" | "failed";
        generatedAt?: string;
    };
    transparency: {
        status: "not_started" | "generated" | "appended" | "verified" | "invalid" | "failed";
        entryHash?: string;
        chainHash?: string;
    };
    submission: {
        status: "not_started" | "dry_run" | "submitted" | "failed" | "blocked";
        target?: string;
        submittedAt?: string;
        receiptId?: string;
        remoteUrl?: string;
    };
    registryMetadata: {
        status: "not_started" | "generated" | "failed";
        image?: string;
        tag?: string;
    };
};
export type OrganizationState = {
    enabled: boolean;
    policyBundle: {
        status: "not_started" | "generated" | "signed" | "verified" | "invalid" | "failed";
        fingerprint?: string;
    };
    approvals: {
        status: "not_started" | "not_required" | "not_met" | "met" | "blocked" | "invalid";
        approvalPolicy?: string;
        approvedCount?: number;
        missingRoles?: string[];
    };
    receiptRefresh: {
        status: "not_started" | "dry_run" | "verified" | "failed" | "blocked";
        verifiedAt?: string;
    };
    retention: {
        status: "not_started" | "planned" | "marked" | "failed";
        policy?: string;
        retainUntil?: string | null;
        legalHold?: boolean;
    };
    evidenceExport: {
        status: "not_started" | "generated" | "verified" | "invalid" | "failed";
        mode?: string;
    };
    audit: {
        status: "not_started" | "verified" | "invalid" | "failed";
        latestChainHash?: string;
    };
    report: {
        status: "not_started" | "generated" | "failed";
    };
};
export type AuditState = {
    schema: {
        status: "not_started" | "installed" | "validated" | "failed";
        activeSchema?: string;
    };
    map: {
        status: "not_started" | "generated" | "failed";
        generatedAt?: string;
    };
    coverage: {
        status: "not_started" | "generated" | "failed";
        percentSatisfied?: number;
        criticalMissing?: number;
        highMissing?: number;
    };
    gaps: {
        status: "not_started" | "generated" | "failed";
        p0?: number;
        p1?: number;
    };
    export: {
        status: "not_started" | "generated" | "signed" | "verified" | "invalid" | "failed";
        signed?: boolean;
    };
    complianceBundle: {
        status: "not_started" | "generated" | "signed" | "verified" | "invalid" | "failed";
        schema?: string;
    };
    reviewerDirectory: {
        status: "not_started" | "previewed" | "imported" | "failed";
        reviewersImported?: number;
    };
    auditorHandoff: {
        status: "not_started" | "generated" | "verified" | "invalid" | "failed";
    };
};
export type EvidenceLifecycleState = {
    inventory: {
        status: "not_started" | "generated" | "failed";
        totalFiles?: number;
        totalBytes?: number;
        blockedFiles?: number;
    };
    retentionEnforcement: {
        status: "not_started" | "previewed" | "failed";
        archiveRecommended?: boolean;
        purgeImplemented: false;
    };
    archive: {
        status: "not_started" | "previewed" | "archived" | "verified" | "invalid" | "failed";
        mode?: string;
        archivePath?: string;
        archiveSha256?: string;
    };
    retentionLedger: {
        status: "not_started" | "recorded" | "verified" | "invalid" | "failed";
        latestChainHash?: string;
    };
    legalHold: {
        status: "not_started" | "enabled" | "released" | "failed";
        enabledAt?: string;
        releasedAt?: string;
    };
    compaction: {
        status: "not_started" | "reported" | "bundled" | "verified" | "invalid" | "failed";
        estimatedSavingsBytes?: number;
    };
    report: {
        status: "not_started" | "generated" | "failed";
    };
};
export type EvidenceDisposalState = {
    eligibility: {
        status: "not_started" | "eligible" | "blocked" | "failed";
        checkedAt?: string;
    };
    candidates: {
        status: "not_started" | "generated" | "failed";
        files?: number;
        bytes?: number;
    };
    plan: {
        status: "not_started" | "ready" | "ready_with_warnings" | "blocked" | "failed";
        estimatedFilesToDelete?: number;
        estimatedBytesToDelete?: number;
    };
    attestation: {
        status: "not_started" | "generated" | "signed" | "failed";
    };
    approvals: {
        status: "not_started" | "not_required" | "not_met" | "met" | "blocked" | "invalid";
    };
    precheck: {
        status: "not_started" | "passed" | "failed";
    };
    execution: {
        status: "not_started" | "dry_run" | "completed" | "partial" | "failed";
        deletedFiles?: number;
        deletedBytes?: number;
        executedAt?: string;
    };
    ledger: {
        status: "not_started" | "recorded" | "verified" | "invalid" | "failed";
    };
};
