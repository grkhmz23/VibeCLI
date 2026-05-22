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

export async function diagnoseProviders(args: {
  config: VibeConfig;
  registry: Map<string, ModelProvider>;
  includeModels?: boolean;
}): Promise<ProviderDiagnostic[]> {
  const rows: ProviderDiagnostic[] = [];
  for (const [name, providerConfig] of Object.entries(args.config.providers)) {
    const provider = args.registry.get(name);
    const env =
      "api_key_env" in providerConfig
        ? process.env[providerConfig.api_key_env]
          ? "present"
          : "missing"
        : "not_required";
    let message = provider ? "Provider configured" : "Provider adapter not found";
    let health: ProviderDiagnostic["health"] = provider ? "ok" : "failed";
    if (provider) {
      try {
        const check = await provider.healthCheck();
        health = check.ok ? "ok" : "warning";
        message = check.message;
      } catch (error) {
        health = "failed";
        message = error instanceof Error ? error.message : String(error);
      }
    }
    let models: number | null | undefined;
    if (args.includeModels && provider) {
      try {
        models = (await provider.listModels()).length;
      } catch {
        models = null;
      }
    }
    rows.push({
      provider: name,
      type: providerConfig.type,
      env,
      health: env === "missing" ? "warning" : health,
      message,
      supportsRunAgent: typeof provider?.runAgent === "function",
      supportsStreamAgent: typeof provider?.streamAgent === "function",
      supportsModelListing: typeof provider?.listModels === "function",
      models
    });
  }
  return rows;
}
