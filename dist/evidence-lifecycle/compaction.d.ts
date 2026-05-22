export type CompactionReport = {
    runId: string;
    createdAt: string;
    totalBytes: number;
    summaryBundleBytesEstimate: number;
    estimatedSavingsBytes: number;
    estimatedSavingsPercent: number;
    largeArtifacts: Array<{
        path: string;
        sizeBytes: number;
        class: string;
        recommendation: "keep" | "summarize_in_bundle" | "exclude_from_summary_bundle";
    }>;
    summaryBundleRecommended: boolean;
    deleteOriginalsRecommended: false;
    purgeImplemented: false;
    warnings: string[];
};
export declare function createCompactionReport(cwd: string, runId: string): Promise<CompactionReport>;
export declare function createCompactEvidenceBundle(cwd: string, runId: string, options?: {
    confirm?: string;
}): Promise<object>;
export declare function verifyCompactEvidenceBundle(cwd: string, runId: string): Promise<{
    ok: boolean;
    checks: Array<{
        name: string;
        ok: boolean;
        message: string;
    }>;
}>;
