import { join } from "node:path";
import { readJson } from "../utils/fs.js";
import { RunStore } from "../orchestrator/run-store.js";

export type ModelUsageEntry = {
  agent: string;
  provider: string;
  model: string;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
};

export async function readModelUsage(cwd: string, runId: string): Promise<ModelUsageEntry[]> {
  try {
    const usage = await readJson<{ entries: ModelUsageEntry[] }>(
      join(new RunStore(cwd).runPath(runId), "model-usage.json")
    );
    return usage.entries ?? [];
  } catch {
    return [];
  }
}
