import type { Command } from "commander";
import { initConfig } from "../config/config.js";
import { logger } from "../utils/logger.js";

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Initialize VibeCLI local config and artifact directories")
    .option("--force", "overwrite existing config and policy")
    .action(async (options: { force?: boolean }) => {
      await initConfig(process.cwd(), Boolean(options.force));
      logger.info("Initialized VibeCLI in .vibecli/");
    });
}
