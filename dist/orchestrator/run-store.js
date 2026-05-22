import { appendFile, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { runsPath } from "../config/config.js";
import { requiredSecurityPolicy } from "../config/defaults.js";
import { ensureDir, pathExists, readJson, writeJson } from "../utils/fs.js";
export class RunStore {
    cwd;
    constructor(cwd) {
        this.cwd = cwd;
    }
    runPath(runId) {
        return join(this.cwd, runsPath, runId);
    }
    async createRunDirectory(runId) {
        const runPath = this.runPath(runId);
        await ensureDir(runPath);
        await ensureDir(join(runPath, "agents"));
        await ensureDir(join(runPath, "agent-outputs"));
        await ensureDir(join(runPath, "patches"));
        return runPath;
    }
    async writeInput(runId, input) {
        await writeJson(join(this.runPath(runId), "input.json"), input);
    }
    async writeState(state) {
        await writeJson(join(this.runPath(state.runId), "state.json"), state);
    }
    async readState(runId) {
        return readJson(join(this.runPath(runId), "state.json"));
    }
    async appendEvent(runId, event) {
        await appendFile(join(this.runPath(runId), "agent-events.jsonl"), `${JSON.stringify(event)}\n`, "utf8");
    }
    async writeArtifact(runId, relativePath, value) {
        await writeJson(join(this.runPath(runId), relativePath), value);
    }
    async writeTextArtifact(runId, relativePath, value) {
        const path = join(this.runPath(runId), relativePath);
        await ensureDir(dirname(path));
        await writeFile(path, value, "utf8");
    }
    async writeSecurityBaseline(runId) {
        await this.writeArtifact(runId, "security-baseline.json", requiredSecurityPolicy);
    }
    async latestRunId() {
        const dir = join(this.cwd, runsPath);
        if (!pathExists(dir))
            return undefined;
        const entries = await readdir(dir, { withFileTypes: true });
        const states = await Promise.all(entries
            .filter((entry) => entry.isDirectory())
            .map(async (entry) => {
            const statePath = join(dir, entry.name, "state.json");
            if (!pathExists(statePath))
                return undefined;
            const state = JSON.parse(await readFile(statePath, "utf8"));
            return state;
        }));
        return states
            .filter((state) => Boolean(state))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.runId;
    }
}
//# sourceMappingURL=run-store.js.map