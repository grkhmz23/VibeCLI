import type { Command } from "commander";
import { refreshLedgerAfterOperation } from "../ledger/events.js";
import { buildReviewWorkspace } from "../orchestrator/workspace.js";

export function registerWorkspaceCommand(program: Command): void {
  program
    .command("workspace")
    .argument("<run-id>", "run id")
    .option("--json", "print JSON")
    .option("--write", "refresh review workspace artifacts")
    .description("Create and display a complete review workspace")
    .action(async (runId: string, options: { json?: boolean; write?: boolean }) => {
      const workspace = await buildReviewWorkspace(process.cwd(), runId, options.write ?? true);
      if (options.write ?? true) await refreshLedgerAfterOperation(process.cwd(), runId);
      console.log(
        options.json
          ? JSON.stringify(workspace, null, 2)
          : [
              `Review workspace: ${workspace.runId}`,
              `Status: ${workspace.runStatus}`,
              `Policy: ${workspace.policy ?? "none"}`,
              `Routing: ${workspace.routing.strategy ?? "unknown"} (${workspace.routing.agents} routes)`,
              `Ledger: ${workspace.ledger.status} (${workspace.ledger.entries} entries)`,
              `Readiness: ${workspace.readiness ?? "unknown"}`,
              `Lifecycle: branch=${workspace.lifecycle.branch ?? "unknown"} commit=${workspace.lifecycle.commit} pr=${workspace.lifecycle.pr} merge=${workspace.lifecycle.mergeReadiness}`,
              `Patches: ${workspace.patches.length}`,
              `Commands: ${workspace.commands.length}`,
              `Verification: ${workspace.verification.status ?? "not_started"}`,
              `Scanners: ${workspace.scanners.status ?? "not_started"}`,
              `Cost: ${workspace.cost.known ? workspace.cost.estimatedUsd : "unknown"}`,
              "Next safe actions:",
              ...workspace.nextActions.map((action) => `- ${action}`)
            ].join("\n")
      );
    });
}
