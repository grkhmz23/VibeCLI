import { type AgentRoleId } from "./roles.js";
import { type ValidationResult } from "./validators.js";
import type { AgentMessage, AgentRunResponse, AgentStreamEvent, ModelProvider } from "../providers/types.js";
export type AgentExecutorResult = {
    ok: true;
    output: unknown;
    response: AgentRunResponse;
    attempts: number;
} | {
    ok: false;
    raw: string;
    validation: ValidationResult;
    response?: AgentRunResponse;
    attempts: number;
};
export declare function buildAgentMessages(args: {
    role: AgentRoleId;
    prompt: string;
    repoContext: unknown;
    priorOutputs: Record<string, unknown>;
}): AgentMessage[];
export declare function executeJsonAgent(args: {
    provider: ModelProvider;
    providerName: string;
    model: string;
    role: AgentRoleId;
    messages: AgentMessage[];
    stream?: boolean;
    onStreamEvent?: (event: AgentStreamEvent) => Promise<void>;
}): Promise<AgentExecutorResult>;
