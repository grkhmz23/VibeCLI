export async function diagnoseProviders(args) {
    const rows = [];
    for (const [name, providerConfig] of Object.entries(args.config.providers)) {
        const provider = args.registry.get(name);
        const env = "api_key_env" in providerConfig
            ? process.env[providerConfig.api_key_env]
                ? "present"
                : "missing"
            : "not_required";
        let message = provider ? "Provider configured" : "Provider adapter not found";
        let health = provider ? "ok" : "failed";
        if (provider) {
            try {
                const check = await provider.healthCheck();
                health = check.ok ? "ok" : "warning";
                message = check.message;
            }
            catch (error) {
                health = "failed";
                message = error instanceof Error ? error.message : String(error);
            }
        }
        let models;
        if (args.includeModels && provider) {
            try {
                models = (await provider.listModels()).length;
            }
            catch {
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
//# sourceMappingURL=diagnostics.js.map