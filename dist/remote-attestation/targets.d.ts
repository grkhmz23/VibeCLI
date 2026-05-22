export type TargetSummary = {
    name: string;
    type: "generic-http";
    host: string;
    enabled: boolean;
    tokenEnv: string | null;
};
export type TargetDoctorResult = TargetSummary & {
    ok: boolean;
    envPresent: boolean | null;
    pingStatus: number | null;
    warnings: string[];
    errors: string[];
};
export declare function listRemoteTargets(cwd: string): Promise<TargetSummary[]>;
export declare function doctorRemoteTargets(cwd: string, options?: {
    ping?: boolean;
    confirm?: string;
}): Promise<TargetDoctorResult[]>;
export declare function addRemoteTarget(cwd: string, args: {
    name: string;
    url: string;
    tokenEnv?: string;
    confirm?: string;
    replace?: boolean;
    headers?: Record<string, string>;
}): Promise<TargetSummary>;
export declare function disableRemoteTarget(cwd: string, name: string, confirm?: string): Promise<TargetSummary>;
export declare function removeRemoteTarget(cwd: string, name: string, confirm?: string): Promise<{
    name: string;
    removed: boolean;
}>;
