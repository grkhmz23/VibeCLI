import type { Command } from "commander";
import { generateCommitMessage } from "../git-lifecycle/commit-message.js";

export function registerCommitMessageCommand(program: Command): void {
  const action = async (
    runId: string,
    options: { style?: "conventional" | "plain"; json?: boolean }
  ) => {
    const result = await generateCommitMessage(process.cwd(), runId, options.style);
    console.log(
      options.json ? JSON.stringify(result, null, 2) : `${result.subject}\n\n${result.body}`
    );
  };
  program
    .command("commit-message")
    .argument("<run-id>", "run id")
    .option("--style <style>", "conventional or plain")
    .option("--json", "print JSON")
    .description("Generate commit message for a run")
    .action(action);
  program
    .command("commit-msg")
    .argument("<run-id>", "run id")
    .option("--style <style>", "conventional or plain")
    .option("--json", "print JSON")
    .description("Alias for commit-message")
    .action(action);
}
