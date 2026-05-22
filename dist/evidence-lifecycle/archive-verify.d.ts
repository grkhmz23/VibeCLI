export declare function verifyEvidenceArchive(cwd: string, runId: string): Promise<{
    ok: boolean;
    checks: Array<{
        name: string;
        ok: boolean;
        message: string;
    }>;
}>;
