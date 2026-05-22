export type AuditManifest = {
    runId: string;
    createdAt: string;
    algorithm: "sha256";
    files: Array<{
        path: string;
        sha256: string;
        sizeBytes: number;
    }>;
    archivePath?: string;
    archiveSha256?: string;
    manifestHash: string;
};
export declare function verifyAuditManifest(root: string, manifestPath: string, envelopePath?: string, reportPath?: string): Promise<{
    ok: boolean;
    checks: Array<{
        name: string;
        ok: boolean;
        message: string;
    }>;
}>;
