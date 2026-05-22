export type ReviewWorkspace = {
    runId: string;
    createdAt: string;
    runStatus: string;
    approvalStatus: string;
    applyStatus: string;
    prompt: string;
    repoSummary: {
        repoRoot: string;
        packageManager: string;
        frameworks: string[];
        currentBranch: string | null;
    };
    agents: Array<{
        id: string;
        status: string;
        summary: string | null;
    }>;
    patches: Array<{
        agent: string;
        path: string;
        operation: string;
        applied: boolean;
        blocked: boolean;
        reason: string | null;
    }>;
    commands: Array<{
        agent: string;
        command: string;
        classification: string;
        reason: string;
    }>;
    security: {
        verdict: string | null;
        criticalFindings: number;
        highFindings: number;
    };
    verification: {
        status: string | null;
        passed: number;
        failed: number;
        skipped: number;
    };
    scanners: {
        status: string | null;
        criticalFindings: number;
        highFindings: number;
        warnings: number;
    };
    cost: {
        known: boolean;
        estimatedUsd: number | null;
        totalTokens: number | null;
    };
    policy: string | null;
    routing: {
        strategy: string | null;
        agents: number;
    };
    ledger: {
        status: string;
        entries: number;
        manifestHash: string | null;
    };
    readiness: string | null;
    lifecycle: {
        branch: string | null;
        commit: string;
        pr: string;
        mergeReadiness: string;
    };
    release: {
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
    provenance: {
        key: string;
        publicKeyFingerprint: string | null;
        statement: string;
        signature: string;
        checksums: string;
        evidence: string;
        githubReleaseDraft: string;
    };
    remoteAttestation: {
        export: string;
        transparency: string;
        submission: string;
        registryMetadata: string;
    };
    organization: {
        enabled: boolean;
        policyBundle: string;
        approvals: string;
        receiptRefresh: string;
        retention: string;
        evidenceExport: string;
        audit: string;
        report: string;
    };
    audit: {
        activeSchema: string | null;
        map: string;
        coverage: string;
        percentSatisfied: number | null;
        criticalMissing: number;
        highMissing: number;
        gaps: string;
        p0: number;
        p1: number;
        export: string;
        complianceBundle: string;
        reviewerDirectory: string;
        auditorHandoff: string;
    };
    evidenceLifecycle: {
        inventory: string;
        totalFiles: number | null;
        archive: string;
        archivePath: string | null;
        retentionLedger: string;
        legalHold: string;
        compaction: string;
        report: string;
    };
    evidenceDisposal: {
        eligibility: string;
        candidates: string;
        plan: string;
        attestation: string;
        approvals: string;
        precheck: string;
        execution: string;
    };
    nextActions: string[];
};
export declare function buildReviewWorkspace(cwd: string, runId: string, write?: boolean): Promise<ReviewWorkspace>;
export declare function renderReviewWorkspaceMarkdown(workspace: ReviewWorkspace): string;
