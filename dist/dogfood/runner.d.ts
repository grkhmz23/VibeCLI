import type { DogfoodFixtureType, DogfoodReport } from "./types.js";
export declare function createDogfoodPlan(cwd: string, options?: {
    writeFixtures?: boolean;
}): Promise<{
    matrix: DogfoodFixtureType[];
    willCreateFixtures: boolean;
    providerCalls: false;
}>;
export declare function runDogfood(cwd: string, options?: {
    fixture?: DogfoodFixtureType;
    applyFixturePatches?: boolean;
    confirm?: string;
}): Promise<DogfoodReport>;
