export type ModelCapabilities = {
    supportsStreaming: boolean | "unknown";
    supportsJsonMode: boolean | "unknown";
    supportsTools: boolean | "unknown";
    supportsVision: boolean | "unknown";
    contextLength: number | null;
    costTier: "free" | "low" | "medium" | "high" | "unknown";
    privacyTier: "local" | "external" | "unknown";
};
export declare const unknownCapabilities: ModelCapabilities;
