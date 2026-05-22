import type { VibeConfig } from "../config/schema.js";
import type { ModelProvider } from "../providers/types.js";
export type ProviderDiagnostic = {
    provider: string;
    type: string;
    env: "present" | "missing" | "not_required";
    health: "ok" | "warning" | "failed";
    message: string;
    supportsRunAgent: boolean;
    supportsStreamAgent: boolean;
    supportsModelListing: boolean;
    models?: number | null;
};
export declare function diagnoseProviders(args: {
    config: VibeConfig;
    registry: Map<string, ModelProvider>;
    includeModels?: boolean;
}): Promise<ProviderDiagnostic[]>;
