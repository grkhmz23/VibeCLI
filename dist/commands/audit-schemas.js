import { auditSchemaSummary } from "../audit/schema.js";
import { installDefaultAuditSchemas, listAuditSchemas, loadAuditSchema, validateAuditSchemas } from "../audit/schema-loader.js";
export function registerAuditSchemasCommand(program) {
    const command = program
        .command("audit-schemas")
        .description("Manage local audit evidence schemas");
    command
        .command("list")
        .option("--json", "print JSON")
        .action(async (options) => {
        const schemas = await listAuditSchemas(process.cwd());
        console.log(options.json
            ? JSON.stringify(schemas, null, 2)
            : schemas.map((schema) => `${schema.name}\t${schema.source}`).join("\n"));
    });
    command
        .command("show")
        .argument("<name>")
        .option("--json", "print JSON")
        .action(async (name, options) => {
        const schema = await loadAuditSchema(process.cwd(), name);
        console.log(options.json
            ? JSON.stringify(schema, null, 2)
            : JSON.stringify(auditSchemaSummary(schema), null, 2));
    });
    command
        .command("validate")
        .argument("[name]")
        .option("--json", "print JSON")
        .action(async (name, options) => {
        const result = await validateAuditSchemas(process.cwd(), name);
        console.log(options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2));
        if (result.some((entry) => !entry.ok))
            process.exitCode = 1;
    });
    command
        .command("install-defaults")
        .option("--force", "overwrite existing schema files")
        .option("--confirm <confirm>", "exact confirmation for overwrite")
        .action(async (options) => {
        console.log(JSON.stringify(await installDefaultAuditSchemas(process.cwd(), options), null, 2));
    });
}
//# sourceMappingURL=audit-schemas.js.map