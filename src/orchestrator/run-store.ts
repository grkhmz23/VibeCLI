import { appendFile, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { runsPath } from "../config/config.js";
import { requiredSecurityPolicy } from "../config/defaults.js";
import { ensureDir, pathExists, readJson, writeJson } from "../utils/fs.js";
import type { RunEvent, RunState } from "./state.js";

export class RunStore {
  constructor(private readonly cwd: string) {}

  runPath(runId: string): string {
    return join(this.cwd, runsPath, runId);
  }

  async createRunDirectory(runId: string): Promise<string> {
    const runPath = this.runPath(runId);
    await ensureDir(runPath);
    await ensureDir(join(runPath, "agents"));
    await ensureDir(join(runPath, "agent-outputs"));
    await ensureDir(join(runPath, "patches"));
    return runPath;
  }

  async writeInput(runId: string, input: object): Promise<void> {
    await writeJson(join(this.runPath(runId), "input.json"), input);
  }

  async writeState(state: RunState): Promise<void> {
    await writeJson(join(this.runPath(state.runId), "state.json"), state);
  }

  async readState(runId: string): Promise<RunState> {
    return readJson<RunState>(join(this.runPath(runId), "state.json"));
  }

  async appendEvent(runId: string, event: RunEvent): Promise<void> {
    await appendFile(
      join(this.runPath(runId), "agent-events.jsonl"),
      `${JSON.stringify(event)}\n`,
      "utf8"
    );
  }

  async writeArtifact(runId: string, relativePath: string, value: unknown): Promise<void> {
    await writeJson(join(this.runPath(runId), relativePath), value);
  }

  async writeTextArtifact(runId: string, relativePath: string, value: string): Promise<void> {
    const path = join(this.runPath(runId), relativePath);
    await ensureDir(dirname(path));
    await writeFile(path, value, "utf8");
  }

  async writeSecurityBaseline(runId: string): Promise<void> {
    await this.writeArtifact(runId, "security-baseline.json", requiredSecurityPolicy);
  }

  async latestRunId(): Promise<string | undefined> {
    const dir = join(this.cwd, runsPath);
    if (!pathExists(dir)) return undefined;
    const entries = await readdir(dir, { withFileTypes: true });
    const states = await Promise.all(
      entries
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => {
          const statePath = join(dir, entry.name, "state.json");
          if (!pathExists(statePath)) return undefined;
          const state = JSON.parse(await readFile(statePath, "utf8")) as Pick<
            RunState,
            "runId" | "createdAt"
          >;
          return state;
        })
    );
    return states
      .filter((state): state is Pick<RunState, "runId" | "createdAt"> => Boolean(state))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.runId;
  }
}
