import type { AgentRoleId } from "./roles.js";
export type ValidationResult = {
    ok: true;
    value: unknown;
} | {
    ok: false;
    raw: string;
    error: {
        message: string;
        issues?: unknown;
    };
};
export declare function parseAgentJsonOutput(role: AgentRoleId, raw: string): ValidationResult;
