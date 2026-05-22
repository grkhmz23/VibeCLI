import type { Command } from "commander";
import { commitRun } from "../git-lifecycle/commit.js";

export function registerCommitCommand(program: Command): void {
  program
    .command("commit")
    .argument("<run-id>", "run id")
    .option("--create", "create commit")
    .option("--confirm <confirm>", "exact confirmation")
    .option("--allow-unapplied", "allow unapplied run")
    .option("--allow-ledger-warning", "allow ledger warning")
    .option("--allow-unverified", "allow missing verification")
    .option("--allow-risk", "allow scanner risk")
    .option("--allow-protected-branch", "allow protected branch")
    .option("--allow-dirty", "allow dirty worktree")
    .option("--include-handoff-artifacts", "include selected redacted handoff files")
    .option("--json", "print JSON")
    .description("Preview or create a guarded commit")
    .action(
      async (
        runId: string,
        options: {
          create?: boolean;
          confirm?: string;
          allowUnapplied?: boolean;
          allowLedgerWarning?: boolean;
          allowUnverified?: boolean;
          allowRisk?: boolean;
          allowProtectedBranch?: boolean;
          allowDirty?: boolean;
          includeHandoffArtifacts?: boolean;
          json?: boolean;
        }
      ) => {
        const result = await commitRun(process.cwd(), runId, options);
        console.log(
          options.json
            ? JSON.stringify(result, null, 2)
            : [
                `Commit: ${result.subject}`,
                `Mode: ${result.mode}`,
                `Branch: ${result.branch ?? "unknown"}`,
                `Files to stage: ${result.filesStaged.join(", ") || "preview only"}`,
                `Blocked: ${result.errors.join("; ") || "none"}`,
                `Create: vibe commit ${runId} --create --confirm "COMMIT ${runId}"`
              ].join("\n")
        );
      }
    );
}
