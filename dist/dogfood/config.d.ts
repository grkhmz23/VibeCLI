import type { DogfoodState } from "./types.js";
export declare const dogfoodStatePath = ".vibecli/dogfood/DOGFOOD_STATE.json";
export declare function defaultDogfoodState(): DogfoodState;
export declare function readDogfoodState(cwd: string): Promise<DogfoodState>;
export declare function updateDogfoodState(cwd: string, update: Omit<Partial<DogfoodState>, "latestReports"> & {
    latestReports?: Partial<DogfoodState["latestReports"]>;
}): Promise<DogfoodState>;
