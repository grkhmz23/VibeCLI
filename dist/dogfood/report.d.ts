import type { DogfoodReport } from "./types.js";
export declare function dogfoodRunId(): string;
export declare function writeDogfoodReport(cwd: string, report: DogfoodReport): Promise<string>;
export declare function latestDogfoodReport(cwd: string): Promise<DogfoodReport | null>;
