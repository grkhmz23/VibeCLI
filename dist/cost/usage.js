import { join } from "node:path";
import { readJson } from "../utils/fs.js";
import { RunStore } from "../orchestrator/run-store.js";
export async function readModelUsage(cwd, runId) {
    try {
        const usage = await readJson(join(new RunStore(cwd).runPath(runId), "model-usage.json"));
        return usage.entries ?? [];
    }
    catch {
        return [];
    }
}
//# sourceMappingURL=usage.js.map