import { join } from "node:path";
import { RunStore } from "../orchestrator/run-store.js";
import { pathExists, readJson } from "../utils/fs.js";
export async function readRemoteSubmissionReceipt(cwd, runId) {
    const path = join(new RunStore(cwd).runPath(runId), "remote-attestation", "REMOTE_SUBMISSION_RECEIPT.json");
    return pathExists(path) ? readJson(path) : null;
}
export function parseRemoteReceipt(body) {
    try {
        const parsed = JSON.parse(body);
        const id = parsed.receiptId ?? parsed.id;
        const url = parsed.url ?? parsed.entryUrl ?? parsed.transparencyUrl;
        return {
            remoteReceiptId: typeof id === "string" ? id : null,
            remoteUrl: typeof url === "string" ? url : null
        };
    }
    catch {
        return { remoteReceiptId: null, remoteUrl: null };
    }
}
//# sourceMappingURL=receipt.js.map