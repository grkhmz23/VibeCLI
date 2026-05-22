export type HandoffRisk = {
    severity: "low" | "medium" | "high" | "critical";
    source: string;
    message: string;
    recommendation: string;
};
export type HandoffSummary = {
    runId: string;
    createdAt: string;
    policy: string | null;
    profile: string | null;
    routingStrategy: string | null;
    runStatus: string;
    approvalStatus: string;
    applyStatus: string;
    verificationStatus: string | null;
    scannerStatus: string | null;
    ledgerStatus: "pass" | "fail" | "missing" | "unknown";
    sourceModified: boolean;
    filesChanged: string[];
    lifecycle?: {
        branch: string | null;
        commit: string;
        pr: string;
        mergeReadiness: string;
    };
    release?: {
        packet: string;
        channel: string | null;
        changelog: string;
        version: string;
        releaseBranch: string;
        tag: string;
        ci: string;
        deploymentReadiness: string;
        releaseReadiness: string;
    };
    provenance?: {
        key: string;
        publicKeyFingerprint: string | null;
        statement: string;
        signature: string;
        checksums: string;
        evidence: string;
        githubReleaseDraft: string;
    };
    remoteAttestation?: {
        export: string;
        transparency: string;
        submission: string;
        registryMetadata: string;
    };
    organization?: {
        enabled: boolean;
        policyBundle: string;
        approvals: string;
        receiptRefresh: string;
        retention: string;
        evidenceExport: string;
        audit: string;
        report: string;
    };
    evidenceLifecycle?: {
        inventory: string;
        archive: string;
        retentionLedger: string;
        legalHold: string;
        compaction: string;
        report: string;
    };
    evidenceDisposal?: {
        eligibility: string;
        candidates: string;
        plan: string;
        approvals: string;
        precheck: string;
        execution: string;
    };
    patches: {
        total: number;
        applied: number;
        pending: number;
        blocked: number;
    };
    gates: Array<{
        name: string;
        status: string;
        blocking: boolean;
    }>;
    risks: HandoffRisk[];
    nextActions: string[];
};
export type HandoffManifest = {
    runId: string;
    createdAt: string;
    algorithm: "sha256";
    files: Array<{
        path: string;
        sha256: string;
        sizeBytes: number;
    }>;
    manifestHash: string;
};
