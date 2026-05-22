import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { RunStore } from "./run-store.js";
import { pathExists } from "../utils/fs.js";
function now() {
    return new Date().toISOString();
}
export async function approveRun(cwd, runId) {
    const store = new RunStore(cwd);
    const state = await store.readState(runId);
    state.approval = { status: "approved", approvedAt: now() };
    state.updatedAt = now();
    const event = {
        timestamp: now(),
        type: "approval_recorded",
        message: "Approval intent recorded for future phase"
    };
    state.events.push(event);
    await store.appendEvent(runId, event);
    await store.writeState(state);
    const manifestPath = join(store.runPath(runId), "patches", "manifest.json");
    const commandReviewPath = join(store.runPath(runId), "command-review.json");
    const manifest = pathExists(manifestPath) ? await readFile(manifestPath, "utf8") : "{}";
    const commandReview = pathExists(commandReviewPath)
        ? await readFile(commandReviewPath, "utf8")
        : "{}";
    return [
        "Pending patch proposals:",
        manifest,
        "Command recommendations:",
        commandReview,
        "Approval recorded. Phase 3 requires an explicit apply command with confirmation before source files can change.",
        "Patch application is intentionally disabled unless vibe apply is explicitly invoked with confirmation."
    ].join("\n");
}
export async function rejectRun(cwd, runId) {
    const store = new RunStore(cwd);
    const state = await store.readState(runId);
    state.approval = { status: "rejected", rejectedAt: now() };
    state.status = "rejected";
    state.updatedAt = now();
    const event = {
        timestamp: now(),
        type: "run_rejected",
        message: "Run rejected by user"
    };
    state.events.push(event);
    await store.appendEvent(runId, event);
    await store.writeState(state);
}
//# sourceMappingURL=approval.js.map