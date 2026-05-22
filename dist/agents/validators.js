import { ZodError } from "zod";
import { schemaForAgent } from "./contracts.js";
export function parseAgentJsonOutput(role, raw) {
    try {
        const parsed = JSON.parse(raw);
        return { ok: true, value: schemaForAgent(role).parse(parsed) };
    }
    catch (error) {
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
//# sourceMappingURL=validators.js.map