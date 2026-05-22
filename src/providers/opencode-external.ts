import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type {
  AgentRunRequest,
  AgentRunResponse,
  ModelInfo,
  ModelProvider,
  ProviderHealth
} from "./types.js";

const execFileAsync = promisify(execFile);
const providerModelPattern = /\b[A-Za-z0-9_.-]+\/[A-Za-z0-9_.:-]+\b/g;

export function parseOpenCodeModels(output: string, provider = "opencode"): ModelInfo[] {
  const ids = new Set(output.match(providerModelPattern) ?? []);
  return [...ids].sort().map((id) => ({ id, provider }));
}

export class OpenCodeExternalProvider implements ModelProvider {
  type = "external-opencode" as const;

  constructor(public readonly name: string) {}

  async healthCheck(): Promise<ProviderHealth> {
    try {
      await execFileAsync("opencode", ["--version"]);
      return { ok: true, provider: this.name, message: "OpenCode binary is available" };
    } catch {
      return {
        ok: false,
        provider: this.name,
        message: "OpenCode is not installed or not on PATH"
      };
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      const { stdout, stderr } = await execFileAsync("opencode", [
        "models",
        "--refresh",
        "--verbose"
      ]);
      return parseOpenCodeModels(`${stdout}\n${stderr}`, this.name);
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
      if (code === "ENOENT") {
        throw new Error("OpenCode is not installed or not on PATH");
      }
      throw error;
    }
  }

  runAgent(request: AgentRunRequest): Promise<AgentRunResponse> {
    void request;
    return Promise.reject(
      new Error("external-opencode runAgent is not enabled in Phase 2; use model listing only.")
    );
  }
}
