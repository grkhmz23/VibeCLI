import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { existsSync } from "node:fs";
export async function ensureDir(path) {
    await mkdir(path, { recursive: true });
}
export function pathExists(path) {
    return existsSync(path);
}
export async function writeJson(path, value) {
    await ensureDir(dirname(path));
    await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
export async function readJson(path) {
    return JSON.parse(await readFile(path, "utf8"));
}
//# sourceMappingURL=fs.js.map