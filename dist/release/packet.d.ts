import type { ReleaseSummary } from "./types.js";
export declare function buildReleaseSummary(cwd: string, runId: string, options?: {
    channel?: string;
    strict?: boolean;
}): Promise<ReleaseSummary>;
export declare function generateReleasePacket(cwd: string, runId: string, options?: {
    channel?: string;
    strict?: boolean;
}): Promise<ReleaseSummary>;
export declare function renderReleasePacket(summary: ReleaseSummary, prompt: string, provenance?: {
    statement?: {
        status: string;
    };
    signature?: {
        status: string;
    };
    evidence?: {
        status: string;
    };
    githubReleaseDraft?: {
        status: string;
    };
}, remoteAttestation?: {
    export?: {
        status: string;
    };
    transparency?: {
        status: string;
    };
    submission?: {
        status: string;
    };
    registryMetadata?: {
        status: string;
    };
}, organization?: {
    enabled: boolean;
    policyBundle?: {
        status: string;
    };
    approvals?: {
        status: string;
        approvedCount?: number;
        missingRoles?: string[];
    };
    receiptRefresh?: {
        status: string;
    };
    retention?: {
        status: string;
    };
    evidenceExport?: {
        status: string;
    };
    audit?: {
        status: string;
    };
}, audit?: {
    schema?: {
        activeSchema?: string;
    };
    coverage?: {
        status: string;
        percentSatisfied?: number;
        criticalMissing?: number;
        highMissing?: number;
    };
    export?: {
        status: string;
    };
    complianceBundle?: {
        status: string;
    };
    auditorHandoff?: {
        status: string;
    };
}, evidenceLifecycle?: {
    inventory?: {
        status: string;
        totalFiles?: number;
    };
    archive?: {
        status: string;
        archivePath?: string;
    };
    retentionLedger?: {
        status: string;
    };
    legalHold?: {
        status: string;
    };
    compaction?: {
        status: string;
    };
}, evidenceDisposal?: {
    eligibility?: {
        status: string;
    };
    plan?: {
        status: string;
    };
    precheck?: {
        status: string;
    };
    execution?: {
        status: string;
    };
}): string;
