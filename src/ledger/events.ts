import { writeLedgerManifest } from "./manifest.js";

export async function refreshLedgerAfterOperation(cwd: string, runId: string): Promise<void> {
  await writeLedgerManifest(cwd, runId);
}
