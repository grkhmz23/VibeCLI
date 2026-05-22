export type PackageManifestSummary = {
    name: string | null;
    version: string | null;
    bin: string | null;
    files: string[];
};
export declare function readPackageManifestSummary(cwd: string): Promise<PackageManifestSummary>;
