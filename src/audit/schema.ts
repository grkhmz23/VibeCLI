import type { AuditSchema } from "./types.js";
import { validateAuditSchema } from "./validation.js";

export function assertValidAuditSchema(schema: AuditSchema): void {
  const errors = validateAuditSchema(schema);
  if (errors.length) throw new Error(errors.join("; "));
}

export function auditSchemaSummary(schema: AuditSchema): object {
  return {
    name: schema.name,
    title: schema.title,
    version: schema.version,
    controls: schema.controls.length,
    disclaimer: schema.disclaimer
  };
}
