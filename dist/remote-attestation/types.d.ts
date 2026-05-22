export type RemoteAttestationTarget = {
    type: "generic-http";
    url: string;
    token_env?: string;
    enabled: boolean;
    headers: Record<string, string>;
};
export type RemoteAttestationConfig = {
    enabled: boolean;
    allow_remote_submission: boolean;
    require_exact_confirmation: boolean;
    require_signed_provenance: boolean;
    require_evidence_bundle: boolean;
    require_ledger_pass: boolean;
    require_release_packet: boolean;
    require_https_targets: boolean;
    allow_localhost_targets: boolean;
    max_payload_bytes: number;
    request_timeout_ms: number;
    send_metadata_only: boolean;
    include_evidence_archive_by_default: boolean;
    targets: Record<string, RemoteAttestationTarget>;
};
export type AttestationExport = {
    version: 1;
    type: "vibecli.attestation.export";
    runId: string;
    createdAt: string;
    release: {
        channel: string | null;
        plannedVersion: string | null;
        tag: string | null;
        releaseReadiness: string | null;
        deploymentReadiness: string | null;
    };
    git: {
        branch: string | null;
        commitSha: string | null;
        repositoryRemote: string | null;
    };
    provenance: {
        statementSha256: string | null;
        envelopeSha256: string | null;
        signed: boolean;
        publicKeyFingerprint: string | null;
    };
    evidence: {
        archiveSha256: string | null;
        manifestSha256: string | null;
        signed: boolean;
    };
    ledger: {
        manifestSha256: string | null;
        verified: boolean;
    };
    verification: {
        status: string | null;
    };
    scanners: {
        status: string | null;
        criticalFindings: number;
        highFindings: number;
    };
    ci: {
        status: string | null;
    };
    policy: {
        name: string | null;
        exceptions: {
            open: number;
            approved: number;
            rejected: number;
        };
    };
    checksums: Array<{
        path: string;
        sha256: string;
        sizeBytes: number;
    }>;
    warnings: string[];
};
export type RemotePayload = {
    version: 1;
    kind: "vibecli.remote-attestation";
    runId: string;
    createdAt: string;
    metadataOnly: boolean;
    attestationExportSha256: string;
    provenanceEnvelopeSha256: string | null;
    evidenceManifestSha256: string | null;
    ledgerManifestSha256: string | null;
    releaseReadiness: string | null;
    deploymentReadiness: string | null;
    publicKeyFingerprint: string | null;
    warnings: string[];
};
export type ExportManifest = {
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
export type TransparencyEntry = {
    version: 1;
    kind: "vibecli.transparency.entry";
    runId: string;
    createdAt: string;
    entryHash: string;
    release: {
        channel: string | null;
        version: string | null;
        tag: string | null;
    };
    subjects: Array<{
        name: string;
        sha256: string;
    }>;
    provenance: {
        signed: boolean;
        envelopeSha256: string | null;
        publicKeyFingerprint: string | null;
    };
    evidence: {
        archiveSha256: string | null;
        manifestSha256: string | null;
    };
    ledger: {
        manifestSha256: string | null;
        verified: boolean;
    };
    policy: {
        name: string | null;
        strict: boolean;
    };
    attestations: {
        verificationPassed: boolean;
        scannerHighCriticalClear: boolean;
        ciPassed: boolean;
        deploymentReady: boolean;
        releaseApprovalPresent: boolean;
    };
    warnings: string[];
};
export type TransparencyChainEntry = {
    index: number;
    runId: string;
    createdAt: string;
    entryHash: string;
    previousChainHash: string | null;
    chainHash: string;
};
export type RemoteSubmissionReceipt = {
    runId: string;
    createdAt: string;
    target: string;
    targetType: "generic-http";
    targetHost: string;
    submitted: boolean;
    statusCode: number | null;
    requestSha256: string;
    responseSha256: string | null;
    remoteReceiptId: string | null;
    remoteUrl: string | null;
    warnings: string[];
    errors: string[];
};
export type RegistryMetadata = {
    runId: string;
    createdAt: string;
    format: "oci-inspired";
    image: {
        name: string | null;
        tag: string | null;
        version: string | null;
        revision: string | null;
        source: string | null;
        created: string;
    };
    annotations: Record<string, string | null>;
    warnings: string[];
};
