import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execFileAsync = promisify(execFile);
const providerModelPattern = /\b[A-Za-z0-9_.-]+\/[A-Za-z0-9_.:-]+\b/g;
export function parseOpenCodeModels(output, provider = "opencode") {
    const ids = new Set(output.match(providerModelPattern) ?? []);
    return [...ids].sort().map((id) => ({ id, provider }));
}
export class OpenCodeExternalProvider {
    name;
    type = "external-opencode";
    constructor(name) {
        this.name = name;
    }
    async healthCheck() {
        try {
            await execFileAsync("opencode", ["--version"]);
            return { ok: true, provider: this.name, message: "OpenCode binary is available" };
        }
        catch {
            return {
                ok: false,
                provider: this.name,
                message: "OpenCode is not installed or not on PATH"
            };
        }
    }
    async listModels() {
        try {
            const { stdout, stderr } = await execFileAsync("opencode", [
                "models",
                "--refresh",
                "--verbose"
            ]);
            return parseOpenCodeModels(`${stdout}\n${stderr}`, this.name);
        }
        catch (error) {
            const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
            if (code === "ENOENT") {
                throw new Error("OpenCode is not installed or not on PATH");
            }
            throw error;
        }
    }
    runAgent(request) {
        void request;
        return Promise.reject(new Error("external-opencode runAgent is not enabled in Phase 2; use model listing only."));
    }
}
//# sourceMappingURL=opencode-external.js.map