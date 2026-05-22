export class VibeError extends Error {
    exitCode;
    constructor(message, exitCode = 1) {
        super(message);
        this.exitCode = exitCode;
        this.name = "VibeError";
    }
}
export function messageFromError(error) {
    return error instanceof Error ? error.message : String(error);
}
//# sourceMappingURL=errors.js.map