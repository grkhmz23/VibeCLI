import type { AuditSchema } from "./types.js";
export declare function listAuditSchemas(cwd: string): Promise<Array<{
    name: string;
    source: "builtin" | "local";
    title: string;
}>>;
export declare function loadAuditSchema(cwd: string, name: string): Promise<AuditSchema>;
export declare function validateAuditSchemas(cwd: string, name?: string): Promise<Array<{
    name: string;
    ok: boolean;
    errors: string[];
}>>;
export declare function installDefaultAuditSchemas(cwd: string, options?: {
    force?: boolean;
    confirm?: string;
}): Promise<string[]>;
