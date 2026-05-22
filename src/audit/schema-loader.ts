import { readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import YAML from "yaml";
import { auditPaths } from "./config.js";
import { builtinAuditSchema, builtinAuditSchemas } from "./builtin-schemas.js";
import { assertValidAuditSchema } from "./schema.js";
import { validateAuditSchema } from "./validation.js";
import { ensureDir, pathExists, readJson } from "../utils/fs.js";
import type { AuditSchema } from "./types.js";

export async function listAuditSchemas(
  cwd: string
): Promise<Array<{ name: string; source: "builtin" | "local"; title: string }>> {
  const builtins = builtinAuditSchemas().map((schema) => ({
    name: schema.name,
    title: schema.title,
    source: "builtin" as const
  }));
  const local = await localSchemas(cwd);
  return [
    ...builtins,
    ...local.map((schema) => ({ name: schema.name, title: schema.title, source: "local" as const }))
  ];
}

export async function loadAuditSchema(cwd: string, name: string): Promise<AuditSchema> {
  const builtin = builtinAuditSchema(name);
  if (builtin) return builtin;
  for (const schema of await localSchemas(cwd)) {
    if (schema.name === name) return schema;
  }
  throw new Error(`Audit schema not found: ${name}`);
}

export async function validateAuditSchemas(
  cwd: string,
  name?: string
): Promise<Array<{ name: string; ok: boolean; errors: string[] }>> {
  const schemas = name
    ? [await loadAuditSchema(cwd, name)]
    : [...builtinAuditSchemas(), ...(await localSchemas(cwd))];
  return schemas.map((schema) => ({
    name: schema.name,
    ok: validateAuditSchema(schema).length === 0,
    errors: validateAuditSchema(schema)
  }));
}

export async function installDefaultAuditSchemas(
  cwd: string,
  options: { force?: boolean; confirm?: string } = {}
): Promise<string[]> {
  const { schemaDir } = await auditPaths(cwd);
  await ensureDir(schemaDir);
  const installed: string[] = [];
  for (const schema of builtinAuditSchemas()) {
    const path = join(schemaDir, `${schema.name}.json`);
    if (pathExists(path) && !options.force) continue;
    if (pathExists(path) && options.force && options.confirm !== "INSTALL AUDIT SCHEMAS") {
      throw new Error(
        "Overwriting audit schemas requires exact confirmation: INSTALL AUDIT SCHEMAS"
      );
    }
    await writeFile(path, `${JSON.stringify(schema, null, 2)}\n`, "utf8");
    installed.push(path);
  }
  return installed;
}

async function localSchemas(cwd: string): Promise<AuditSchema[]> {
  const { schemaDir } = await auditPaths(cwd);
  if (!pathExists(schemaDir)) return [];
  const entries = await readdir(schemaDir, { withFileTypes: true }).catch(() => []);
  const schemas: AuditSchema[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || !/\.(json|ya?ml)$/.test(entry.name)) continue;
    const path = join(schemaDir, entry.name);
    const schema = entry.name.endsWith(".json")
      ? await readJson<AuditSchema>(path)
      : (YAML.parse(
          await import("node:fs/promises").then((fs) => fs.readFile(path, "utf8"))
        ) as AuditSchema);
    assertValidAuditSchema(schema);
    schemas.push(schema);
  }
  return schemas;
}
