import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pathExists } from "../utils/fs.js";
function splitLines(content) {
    if (!content)
        return [];
    const normalized = content.replace(/\r\n/g, "\n");
    return normalized.endsWith("\n") ? normalized.slice(0, -1).split("\n") : normalized.split("\n");
}
export function applyParsedPatchToContent(original, patch) {
    const originalLines = splitLines(original);
    const result = [];
    let oldIndex = 0;
    for (const hunk of patch.hunks) {
        const start = Math.max(0, hunk.oldStart - 1);
        while (oldIndex < start) {
            result.push(originalLines[oldIndex] ?? "");
            oldIndex += 1;
        }
        for (const line of hunk.lines) {
            if (line.startsWith("\\ No newline"))
                continue;
            const marker = line[0];
            const value = line.slice(1);
            if (marker === " ") {
                if ((originalLines[oldIndex] ?? "") !== value) {
                    throw new Error(`Patch context mismatch near: ${value}`);
                }
                result.push(value);
                oldIndex += 1;
            }
            else if (marker === "-") {
                if ((originalLines[oldIndex] ?? "") !== value) {
                    throw new Error(`Patch removal mismatch near: ${value}`);
                }
                oldIndex += 1;
            }
            else if (marker === "+") {
                result.push(value);
            }
        }
    }
    while (oldIndex < originalLines.length) {
        result.push(originalLines[oldIndex] ?? "");
        oldIndex += 1;
    }
    return `${result.join("\n")}\n`;
}
export async function applyParsedFilePatch(repoRoot, patch) {
    const fullPath = join(repoRoot, patch.path);
    if (patch.operation === "delete") {
        await rm(fullPath, { force: true });
        return;
    }
    await mkdir(dirname(fullPath), { recursive: true });
    if (patch.operation === "create") {
        await writeFile(fullPath, applyParsedPatchToContent("", patch), "utf8");
        return;
    }
    if (!pathExists(fullPath))
        throw new Error(`Cannot modify missing file: ${patch.path}`);
    await writeFile(fullPath, applyParsedPatchToContent(await readFile(fullPath, "utf8"), patch), "utf8");
}
//# sourceMappingURL=apply.js.map