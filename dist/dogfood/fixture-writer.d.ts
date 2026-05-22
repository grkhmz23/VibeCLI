import type { DogfoodFixtureType } from "./types.js";
export type FixtureWriteResult = {
    createdAt: string;
    root: string;
    fixtures: Array<{
        type: DogfoodFixtureType;
        path: string;
        gitInitialized: boolean;
    }>;
};
export declare function createDogfoodFixtures(cwd: string, options?: {
    fixture?: DogfoodFixtureType;
}): Promise<FixtureWriteResult>;
export declare function cleanDogfoodFixtures(cwd: string, confirm?: string): Promise<{
    cleaned: boolean;
    path: string;
}>;
