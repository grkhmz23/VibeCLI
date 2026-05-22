import type { Command } from "commander";
import { readLedgerManifest, writeLedgerManifest } from "../ledger/manifest.js";
import { verifyLedger } from "../ledger/verify.js";

export function registerLedgerCommand(program: Command): void {
  program
    .command("ledger")
    .argument("<run-id>", "run id")
    .description("Show or verify tamper-evident run ledger")
    .option("--verify", "verify hashes")
    .option("--refresh", "refresh hashes")
    .option("--strict", "fail on intentionally deleted artifacts")
    .option("--confirm <confirm>", "exact confirmation")
    .option("--json", "print JSON")
    .action(
      async (
        runId: string,
        options: {
          verify?: boolean;
          refresh?: boolean;
          strict?: boolean;
          confirm?: string;
          json?: boolean;
        }
      ) => {
        if (options.refresh) {
          if (options.confirm !== `REFRESH LEDGER ${runId}`) {
            throw new Error(`Ledger refresh requires exact confirmation: REFRESH LEDGER ${runId}`);
          }
          const manifest = await writeLedgerManifest(process.cwd(), runId);
          console.log(
            options.json
              ? JSON.stringify(manifest, null, 2)
              : `Ledger refreshed: ${manifest.entries.length} entries`
          );
          return;
        }
        if (options.verify) {
          const result = await verifyLedger(process.cwd(), runId, { strict: options.strict });
          console.log(
            options.json
              ? JSON.stringify(result, null, 2)
              : `Ledger ${result.status.toUpperCase()}: ${result.entries.length} entries checked`
          );
          if (!result.ok) process.exitCode = 1;
          return;
        }
        const manifest = await readLedgerManifest(process.cwd(), runId);
        console.log(
          options.json
            ? JSON.stringify(manifest, null, 2)
            : `Ledger ${runId}: ${manifest.entries.length} entries, hash ${manifest.manifestHash}`
        );
      }
    );
}
