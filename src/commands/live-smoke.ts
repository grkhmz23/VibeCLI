import type { Command } from "commander";
import { previewLiveSmoke, runLiveRcSmoke, runLiveSmoke } from "../dogfood/live-smoke.js";

export function registerLiveSmokeCommand(program: Command): void {
  program
    .command("live-smoke")
    .option("--provider <provider>", "provider name")
    .option("--model <model>", "model id")
    .option("--profile <name>", "profile name")
    .option("--rc", "run exact-confirmed beta RC live smoke")
    .option("--confirm <value>", "exact confirmation")
    .option("--json", "print JSON")
    .description("Preview or exact-confirm a tiny live provider smoke")
    .action(
      async (options: {
        provider?: string;
        model?: string;
        profile?: string;
        rc?: boolean;
        confirm?: string;
        json?: boolean;
      }) => {
        const result =
          options.rc && options.confirm
            ? await runLiveRcSmoke(process.cwd(), options)
            : options.confirm
              ? await runLiveSmoke(process.cwd(), options)
              : await previewLiveSmoke(process.cwd(), { profile: options.profile });
        console.log(
          options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2)
        );
      }
    );
}
