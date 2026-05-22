import { join } from "node:path";
import { readJson } from "../utils/fs.js";
import { executeAllowedCommandDetailed } from "../tools/shell.js";
import { RunStore } from "./run-store.js";
export async function readCommandReview(cwd, runId) {
    return readJson(join(new RunStore(cwd).runPath(runId), "command-review.json"));
}
export async function executeApprovedCommands(cwd, runId, options) {
    if (options.confirm !== `EXECUTE COMMANDS ${runId}`) {
        throw new Error(`Refusing to execute commands without exact confirmation: EXECUTE COMMANDS ${runId}`);
    }
    const store = new RunStore(cwd);
    const review = await readCommandReview(cwd, runId);
    const commands = [];
    for (const entry of review.recommended) {
        if (entry.classification === "allowed") {
            commands.push(await executeAllowedCommandDetailed(entry.command, cwd, options.timeoutMs ?? 60_000));
        }
        else {
            commands.push({
                command: entry.command,
                status: "skipped",
                exitCode: null,
                stdout: "",
                stderr: "",
                reason: `Skipped ${entry.classification} command`
            });
        }
    }
    const result = { runId, executedAt: new Date().toISOString(), commands };
    await store.writeArtifact(runId, "command-execution.json", result);
    return result;
}
//# sourceMappingURL=commands.js.map