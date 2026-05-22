import { writeLedgerManifest } from "./manifest.js";
export async function refreshLedgerAfterOperation(cwd, runId) {
    await writeLedgerManifest(cwd, runId);
}
//# sourceMappingURL=events.js.map