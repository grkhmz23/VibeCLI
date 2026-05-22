import type { Command } from "commander";
import { refreshReceipt } from "../remote-attestation/receipt-refresh.js";

export function registerReceiptRefreshCommand(program: Command): void {
  program
    .command("receipt-refresh")
    .argument("<run-id>", "run id")
    .option("--dry-run", "validate without remote call")
    .option("--verify-remote", "verify receipt with read-only remote GET")
    .option("--confirm <confirm>", "exact confirmation")
    .option("--json", "print JSON")
    .action(
      async (
        runId: string,
        options: { dryRun?: boolean; verifyRemote?: boolean; confirm?: string; json?: boolean }
      ) => {
        const result = await refreshReceipt(process.cwd(), runId, options);
        console.log(
          options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2)
        );
      }
    );
}
