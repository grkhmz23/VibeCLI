import { validateAuditSchema } from "./validation.js";
export function assertValidAuditSchema(schema) {
    const errors = validateAuditSchema(schema);
    if (errors.length)
        throw new Error(errors.join("; "));
}
export function auditSchemaSummary(schema) {
    return {
        name: schema.name,
        title: schema.title,
        version: schema.version,
        controls: schema.controls.length,
        disclaimer: schema.disclaimer
    };
}
//# sourceMappingURL=schema.js.map