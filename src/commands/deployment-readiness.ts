import type { Command } from "commander";
import { evaluateDeploymentReadiness } from "../release/deployment-readiness.js";

export function registerDeploymentReadinessCommand(program: Command): void {
  const configure = (command: Command): void => {
    command
      .argument("<run-id>", "run id")
      .option("--channel <channel>", "release channel")
      .option("--json", "print JSON")
      .action(async (runId: string, options: { channel?: string; json?: boolean }) => {
        const result = await evaluateDeploymentReadiness(process.cwd(), runId, {
          channel: options.channel
        });
        console.log(
          options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2)
        );
      });
  };
  configure(
    program.command("deployment-readiness").description("Generate deployment-readiness report")
  );
  configure(program.command("deploy-readiness").description("Alias for deployment-readiness"));
}
