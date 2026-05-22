import type { DogfoodFixtureType } from "./types.js";
export type FixtureFile = {
    path: string;
    content: string;
};
export type FixtureDefinition = {
    type: DogfoodFixtureType;
    files: FixtureFile[];
};
export declare function fixtureDefinition(type: DogfoodFixtureType): FixtureDefinition;
