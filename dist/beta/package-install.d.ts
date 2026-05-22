export type PackageInstallCheckReport = {
    createdAt: string;
    status: "passed" | "failed" | "warning";
    package: {
        name: string | null;
        version: string | null;
        bin: string | null;
        files: string[];
    };
    checks: Array<{
        name: string;
        status: "passed" | "failed" | "warning" | "skipped";
        message: string;
    }>;
    tarball: {
        created: boolean;
        path: string | null;
        sizeBytes: number | null;
        containsPrivateArtifacts: boolean;
        containsEnvFiles: boolean;
        containsVibecliRuntimeState: boolean;
    };
    tempInstall: {
        installed: boolean;
        helpWorks: boolean;
        doctorWorks: boolean;
        initWorks: boolean;
        dryRunWorks: boolean;
    };
    warnings: string[];
    errors: string[];
};
export declare function runPackageInstallCheck(cwd: string): Promise<PackageInstallCheckReport>;
