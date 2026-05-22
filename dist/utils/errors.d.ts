export declare class VibeError extends Error {
    readonly exitCode: number;
    constructor(message: string, exitCode?: number);
}
export declare function messageFromError(error: unknown): string;
