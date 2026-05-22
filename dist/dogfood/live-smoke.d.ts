export type LiveSmokeResult = {
    createdAt: string;
    provider: string | null;
    model: string | null;
    status: "passed" | "failed" | "skipped";
    usage: {
        promptTokens: number | null;
        completionTokens: number | null;
        totalTokens: number | null;
    };
    warnings: string[];
    errors: string[];
};
export type LiveRcSmokeResult = {
    createdAt: string;
    status: "passed" | "failed" | "skipped";
    profile: string;
    providers: Array<{
        provider: string;
        model: string | null;
        status: "passed" | "failed" | "skipped";
        usage: {
            promptTokens: number | null;
            completionTokens: number | null;
            totalTokens: number | null;
        };
        warnings: string[];
        errors: string[];
    }>;
    totalUsage: {
        totalTokens: number | null;
    };
    warnings: string[];
    errors: string[];
};
export declare function previewLiveSmoke(cwd: string, options?: {
    profile?: string;
}): Promise<{
    providerCalls: false;
    profile: string;
    routes: Array<{
        agent: string;
        provider: string;
        model: string;
    }>;
    missingEnv: string[];
}>;
export declare function runLiveSmoke(cwd: string, options: {
    provider?: string;
    model?: string;
    profile?: string;
    confirm?: string;
}): Promise<LiveSmokeResult>;
export declare function runLiveRcSmoke(cwd: string, options: {
    profile?: string;
    confirm?: string;
}): Promise<LiveRcSmokeResult>;
