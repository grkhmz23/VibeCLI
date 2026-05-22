export type KeyMetadata = {
  createdAt: string;
  algorithm: "ed25519";
  publicKeyFingerprint: string;
  privateKeyPath: string;
  publicKeyPath: string;
  rotatedFrom: string | null;
};

export type ProvenanceStatement = {
  version: 1;
  format: "slsa-inspired";
  runId: string;
  createdAt: string;
  subject: Array<{ name: string; digest: { sha256: string } }>;
  builder: { id: "vibecli"; version: string | null };
  buildType: "vibecli.local.release";
  invocation: {
    promptHash: string;
    profile: string | null;
    policy: string | null;
    routingStrategy: string | null;
  };
  materials: Array<{ uri: string; digest: { sha256: string } }>;
  metadata: {
    repoRootHash: string | null;
    gitBranch: string | null;
    gitCommit: string | null;
    releaseChannel: string | null;
    plannedVersion: string | null;
    tag: string | null;
    verificationStatus: string | null;
    scannerStatus: string | null;
    ciStatus: string | null;
    deploymentReadiness: string | null;
    releaseReadiness: string | null;
  };
  attestations: {
    ledgerVerified: boolean;
    releasePacketVerified: boolean;
    handoffVerified: boolean;
    verificationPassed: boolean;
    scannerHighCriticalClear: boolean;
    ciPassed: boolean;
    deploymentReady: boolean;
    releaseApprovalPresent: boolean;
  };
  warnings: string[];
};

export type ProvenanceEnvelope = {
  version: 1;
  type: "vibecli.provenance.envelope";
  createdAt: string;
  runId: string;
  statementPath: string;
  statementSha256: string;
  signature: {
    algorithm: "ed25519";
    signatureBase64: string;
    publicKeyFingerprint: string;
  };
  publicKey: {
    pem: string;
    fingerprint: string;
  };
};

export type ProvenanceVerificationResult = {
  runId: string;
  ok: boolean;
  checks: Array<{ name: string; ok: boolean; message: string }>;
  warnings: string[];
};

export type ChecksumManifest = {
  runId: string;
  createdAt: string;
  algorithm: "sha256";
  entries: Array<{ path: string; sha256: string; sizeBytes: number }>;
};

export type EvidenceManifest = {
  runId: string;
  createdAt: string;
  algorithm: "sha256";
  archivePath: string;
  archiveSha256: string;
  files: Array<{ path: string; sha256: string; sizeBytes: number }>;
  signed: boolean;
  provenanceEnvelopePath: string | null;
};
