import { ZodError } from "zod";
import type { AgentRoleId } from "./roles.js";
import { schemaForAgent } from "./contracts.js";

export type ValidationResult =
  | { ok: true; value: unknown }
  | { ok: false; raw: string; error: { message: string; issues?: unknown } };

export function parseAgentJsonOutput(role: AgentRoleId, raw: string): ValidationResult {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return { ok: true, value: schemaForAgent(role).parse(parsed) };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ok: false,
        raw,
        error: { message: "Agent output did not match schema", issues: error.issues }
      };
    }
    return {
      ok: false,
      raw,
      error: { message: error instanceof Error ? error.message : String(error) }
    };
  }
}
