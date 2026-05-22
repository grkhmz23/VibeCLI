import { loadConfig, saveConfig } from "../config/config.js";
import { createProviderRegistry } from "../providers/registry.js";
import { diagnoseProviders } from "../routing/diagnostics.js";
import { logger } from "../utils/logger.js";
export function registerProvidersCommand(program) {
    const providers = program.command("providers").description("Manage configured model providers");
    providers
        .command("list")
        .description("List configured providers")
        .action(async () => {
        const config = await loadConfig(process.cwd());
        for (const [name, provider] of Object.entries(config.providers)) {
            logger.info(`${name}\t${provider.type}`);
        }
    });
    providers
        .command("doctor")
        .description("Diagnose configured providers")
        .option("--models", "also call model listing")
        .option("--json", "print JSON")
        .action(async (options) => {
        const config = await loadConfig(process.cwd());
        const diagnostics = await diagnoseProviders({
            config,
            registry: createProviderRegistry(config),
            includeModels: Boolean(options.models)
        });
        if (options.json) {
            console.log(JSON.stringify(diagnostics, null, 2));
            return;
        }
        for (const item of diagnostics) {
            console.log(`${item.provider}\t${item.type}\tenv:${item.env}\thealth:${item.health}\trun:${item.supportsRunAgent ? "yes" : "no"}\tstream:${item.supportsStreamAgent ? "yes" : "no"}${item.models === undefined ? "" : `\tmodels:${item.models ?? "error"}`} - ${item.message}`);
        }
    });
    const add = providers.command("add").description("Add a provider");
    add
        .command("openrouter")
        .description("Add OpenRouter provider")
        .action(async () => {
        const config = await loadConfig(process.cwd());
        config.providers.openrouter = {
            type: "openrouter",
            api_key_env: "OPENROUTER_API_KEY",
            base_url: "https://openrouter.ai/api/v1"
        };
        await saveConfig(process.cwd(), config);
        logger.info("Added provider openrouter using env OPENROUTER_API_KEY");
    });
    add
        .command("openai-compatible")
        .requiredOption("--name <name>", "provider name")
        .requiredOption("--base-url <url>", "OpenAI-compatible base URL")
        .requiredOption("--api-key-env <ENV_VAR>", "environment variable containing API key")
        .action(async (options) => {
        const config = await loadConfig(process.cwd());
        config.providers[options.name] = {
            type: "openai-compatible",
            base_url: options.baseUrl,
            api_key_env: options.apiKeyEnv
        };
        await saveConfig(process.cwd(), config);
        logger.info(`Added provider ${options.name} using env ${options.apiKeyEnv}`);
    });
    add
        .command("opencode")
        .description("Add external OpenCode adapter")
        .action(async () => {
        const config = await loadConfig(process.cwd());
        config.providers.opencode = {
            type: "external-opencode",
            username_env: "OPENCODE_SERVER_USERNAME",
            password_env: "OPENCODE_SERVER_PASSWORD"
        };
        await saveConfig(process.cwd(), config);
        logger.info("Added provider opencode using external-opencode adapter");
    });
}
//# sourceMappingURL=providers.js.map