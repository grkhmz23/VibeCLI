import { join } from "node:path";
import { RunStore } from "../orchestrator/run-store.js";
import { readJson } from "../utils/fs.js";
export async function readDisposalReceipt(cwd, runId) {
    return readJson(join(new RunStore(cwd).runPath(runId), "evidence-lifecycle", "disposal", "DISPOSAL_RECEIPT.json"));
}
//# sourceMappingURL=receipt.js.map