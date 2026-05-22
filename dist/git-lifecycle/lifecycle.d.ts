export type RepositoryLifecycle = {
    runId: string;
    createdAt: string;
    branch: {
        current: string | null;
        proposed: string | null;
        created: boolean;
        protected: boolean;
    };
    apply: {
        status: string | null;
        filesChanged: string[];
    };
    commit: {
        status: "not_started" | "previewed" | "created" | "failed";
        commitSha: string | null;
        subject: string | null;
    };
    github: {
        prStatus: string | null;
        prUrl: string | null;
        remote: string | null;
    };
    verification: {
        status: string | null;
    };
    scanners: {
        status: string | null;
        criticalFindings: number;
        highFindings: number;
    };
    ledger: {
        status: "pass" | "fail" | "missing" | "unknown";
    };
    readiness: {
        verdict: string | null;
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
        approvals: string;
        retention: string;
        evidenceExport: string;
        audit: string;
    };
    evidenceLifecycle: {
        inventory: string;
        archive: string;
        retentionLedger: string;
        legalHold: string;
        compaction: string;
    };
    evidenceDisposal: {
        eligibility: string;
        plan: string;
        precheck: string;
        execution: string;
    };
    nextActions: string[];
};
export declare function buildLifecycle(cwd: string, runId: string): Promise<RepositoryLifecycle>;
export declare function renderLifecycle(value: RepositoryLifecycle): string;
