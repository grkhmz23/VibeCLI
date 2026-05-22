export declare function ensureDir(path: string): Promise<void>;
export declare function pathExists(path: string): boolean;
export declare function writeJson(path: string, value: unknown): Promise<void>;
export declare function readJson<T>(path: string): Promise<T>;
