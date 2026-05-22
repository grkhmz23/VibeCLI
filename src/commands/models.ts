import type { Command } from "commander";
import { loadConfig } from "../config/config.js";
import { createProviderRegistry } from "../providers/registry.js";
import type { ModelInfo, ModelProvider } from "../providers/types.js";
import { messageFromError } from "../utils/errors.js";

type ModelListResult =
  | { provider: string; ok: true; models: ModelInfo[] }
  | { provider: string; ok: false; error: string; models: [] };

export function registerModelsCommand(program: Command): void {
  program
    .command("models")
    .description("Model commands")
    .command("list")
    .option("--provider <name>", "provider name")
    .option("--json", "print JSON")
    .action(async (options: { provider?: string; json?: boolean }) => {
      const config = await loadConfig(process.cwd());
      const registry = createProviderRegistry(config);
      const selected: Array<[string, ModelProvider | undefined]> = options.provider
        ? [[options.provider, registry.get(options.provider)]]
        : [...registry.entries()];
      const results: ModelListResult[] = [];
      for (const [name, provider] of selected) {
        if (!provider) {
          results.push({
            provider: name,
            ok: false,
            error: "Provider is not configured",
            models: []
          });
          continue;
        }
        try {
          results.push({ provider: name, ok: true, models: await provider.listModels() });
        } catch (error) {
          results.push({ provider: name, ok: false, error: messageFromError(error), models: [] });
        }
      }
      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
        return;
      }
      for (const result of results) {
        if (!result.ok) {
          console.log(`${result.provider}: ${result.error}`);
          continue;
        }
        for (const model of result.models) {
          console.log(`${model.provider}\t${model.id}`);
        }
      }
    });
}
