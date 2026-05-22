import type { ReleaseSummary } from "../release/types.js";
import type { CiStatus } from "../release/types.js";
import type { DeploymentReadiness } from "../release/deployment-readiness.js";
import type { ReleaseReadiness } from "../release/release-readiness.js";
export type ProvenanceCollected = {
    ledgerVerified: boolean;
    releasePacketVerified: boolean;
    handoffVerified: boolean;
    releaseSummary?: ReleaseSummary;
    ci?: CiStatus;
    deployment?: DeploymentReadiness;
    releaseReadiness?: ReleaseReadiness;
    releaseApprovalPresent: boolean;
    materials: Array<{
        uri: string;
        sha256: string;
    }>;
    subject: Array<{
        name: string;
        sha256: string;
    }>;
    gitBranch: string | null;
    gitCommit: string | null;
    warnings: string[];
};
export declare function collectProvenanceInputs(cwd: string, runId: string): Promise<ProvenanceCollected>;
export declare function packageVersion(cwd: string): Promise<string | null>;
