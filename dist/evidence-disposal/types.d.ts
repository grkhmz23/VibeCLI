export type DisposalConfig = {
    enabled: boolean;
    disposal_dir: string;
    require_retention_expired: boolean;
    require_no_legal_hold: boolean;
    require_archive_verified: boolean;
    require_retention_ledger: boolean;
    require_org_approval: boolean;
    require_disposal_attestation: boolean;
    delete_scope: "run-evidence-only";
    allow_archive_deletion: false;
    allow_key_deletion: false;
    allow_source_deletion: false;
    allow_remote_deletion: false;
    allow_automatic_purge: false;
    dry_run_by_default: boolean;
    max_files_per_disposal: number;
    max_bytes_per_disposal: number;
    protected_classes: string[];
    receipt: {
        require_sha256_before_delete: boolean;
        require_post_delete_verification: boolean;
        include_recovery_guidance: boolean;
    };
};
export type DisposalEligibility = {
    runId: string;
    createdAt: string;
    eligible: boolean;
    retention: {
        policy: string | null;
        retainUntil: string | null;
        expired: boolean;
        legalHold: boolean;
        legalHoldStatus: "none" | "enabled" | "released" | "unknown";
    };
    archive: {
        required: boolean;
        present: boolean;
        verified: boolean;
        archivePath: string | null;
    };
    ledger: {
        required: boolean;
        verified: boolean;
    };
    organizationApproval: {
        required: boolean;
        status: "not_required" | "missing" | "met" | "blocked" | "unknown";
    };
    blockingReasons: string[];
    warnings: string[];
    nextActions: string[];
};
export type DisposalCandidates = {
    runId: string;
    createdAt: string;
    scope: "run-evidence-only";
    summary: {
        candidateFiles: number;
        candidateBytes: number;
        blockedFiles: number;
        blockedBytes: number;
    };
    candidates: Array<{
        path: string;
        class: string;
        sizeBytes: number;
        sha256: string;
        reason: string;
        safeToDelete: boolean;
    }>;
    blocked: Array<{
        path: string;
        class: string;
        reason: string;
    }>;
    warnings: string[];
};
export type DisposalPlan = {
    runId: string;
    createdAt: string;
    status: "blocked" | "ready" | "ready_with_warnings";
    scope: "run-evidence-only";
    eligibility: {
        eligible: boolean;
        blockingReasons: string[];
    };
    preDeleteRequirements: Array<{
        name: "retention_expired" | "no_legal_hold" | "archive_verified" | "ledger_verified" | "org_disposal_approval" | "disposal_attestation";
        required: boolean;
        satisfied: boolean;
        message: string;
    }>;
    candidates: Array<{
        path: string;
        sha256: string;
        sizeBytes: number;
        class: string;
        reason: string;
    }>;
    blocked: Array<{
        path: string;
        reason: string;
    }>;
    estimatedBytesToDelete: number;
    estimatedFilesToDelete: number;
    exactConfirmation: string;
    warnings: string[];
    nextActions: string[];
};
export type DisposalAttestation = {
    version: 1;
    type: "vibecli.disposal.attestation";
    runId: string;
    createdAt: string;
    planSha256: string;
    candidateCount: number;
    candidateBytes: number;
    blockedCount: number;
    scope: "run-evidence-only";
    preDeleteRequirementsSatisfied: boolean;
    legalHold: boolean;
    archiveVerified: boolean;
    ledgerVerified: boolean;
    warnings: string[];
    signature: {
        algorithm: "ed25519" | "sha256-local";
        publicKeyFingerprint: string | null;
        payloadHash: string;
        signatureBase64: string | null;
    };
};
export type DisposalApprovals = {
    runId: string;
    createdAt: string;
    approvalPolicy: string;
    minApprovals: number;
    requiredRoles: string[];
    requireDistinctReviewers: boolean;
    approvals: Array<{
        id: string;
        createdAt: string;
        reviewerId: string;
        reviewerDisplayName: string;
        role: string;
        decision: "approved" | "rejected" | "needs_changes";
        noteHash: string;
        planSha256: string;
        candidateSha256: string;
        signature: {
            algorithm: "sha256-local";
            payloadHash: string;
        };
    }>;
    quorum: {
        status: "not_met" | "met" | "blocked";
        approvedCount: number;
        distinctReviewerCount: number;
        missingRoles: string[];
        blockingReasons: string[];
        warnings: string[];
    };
};
export type DisposalPrecheck = {
    runId: string;
    createdAt: string;
    ok: boolean;
    checks: Array<{
        name: string;
        ok: boolean;
        blocking: boolean;
        message: string;
    }>;
    warnings: string[];
    nextActions: string[];
};
export type DisposalReceipt = {
    runId: string;
    createdAt: string;
    status: "completed" | "partial" | "failed";
    scope: "run-evidence-only";
    deleted: Array<{
        path: string;
        sha256BeforeDelete: string;
        sizeBytes: number;
        deleted: boolean;
        verifiedMissing: boolean;
    }>;
    skipped: Array<{
        path: string;
        reason: string;
    }>;
    failed: Array<{
        path: string;
        reason: string;
    }>;
    archiveVerifiedBeforeDelete: boolean;
    legalHoldAtDeleteTime: boolean;
    retentionLedgerEventHash: string | null;
    recoveryGuidancePath: string;
    warnings: string[];
};
export type DeletedArtifactsRecord = {
    runId: string;
    createdAt: string;
    deletedArtifacts: Array<{
        path: string;
        sha256BeforeDelete: string;
        sizeBytes: number;
        receiptSha256: string;
    }>;
};
