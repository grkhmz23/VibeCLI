import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
export async function sha256File(path) {
    const data = await readFile(path);
    const info = await stat(path);
    return { sha256: createHash("sha256").update(data).digest("hex"), sizeBytes: info.size };
}
export function sha256Text(value) {
    return createHash("sha256").update(value).digest("hex");
}
//# sourceMappingURL=hash.js.map