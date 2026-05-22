import { join } from "node:path";
import { pathExists, readJson, writeJson } from "../utils/fs.js";
import type { DogfoodState } from "./types.js";

export const dogfoodStatePath = ".vibecli/dogfood/DOGFOOD_STATE.json";

export function defaultDogfoodState(): DogfoodState {
  return {
    updatedAt: new Date().toISOString(),
    latestDogfoodRunId: null,
    latestBetaVerdict: "unknown",
    latestReports: {
      dogfood: null,
      securityRedteam: null,
      packageCheck: null,
      docsCheck: null,
      perfCheck: null,
      betaCheck: null,
      betaBacklog: null
    }
  };
}

export async function readDogfoodState(cwd: string): Promise<DogfoodState> {
  const path = join(cwd, dogfoodStatePath);
  return pathExists(path) ? readJson<DogfoodState>(path) : defaultDogfoodState();
}

export async function updateDogfoodState(
  cwd: string,
  update: Omit<Partial<DogfoodState>, "latestReports"> & {
    latestReports?: Partial<DogfoodState["latestReports"]>;
  }
): Promise<DogfoodState> {
  const current = await readDogfoodState(cwd);
  const next: DogfoodState = {
    ...current,
    ...update,
    updatedAt: new Date().toISOString(),
    latestReports: { ...current.latestReports, ...(update.latestReports ?? {}) }
  };
  await writeJson(join(cwd, dogfoodStatePath), next);
  return next;
}
