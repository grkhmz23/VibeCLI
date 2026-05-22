import type { ParsedFilePatch, ParsedHunk, PatchOperation } from "./types.js";

function cleanPath(path: string): string | null {
  const value = path.trim().split(/\s+/)[0] ?? "";
  if (value === "/dev/null") return null;
  return value.replace(/^[ab]\//, "");
}

function operation(oldPath: string | null, newPath: string | null): PatchOperation {
  if (!oldPath && newPath) return "create";
  if (oldPath && !newPath) return "delete";
  return "modify";
}

export function parseUnifiedDiff(diff: string): ParsedFilePatch[] {
  if (/GIT binary patch|Binary files .* differ/.test(diff)) {
    throw new Error("Binary patches are not supported");
  }
  const lines = diff.replace(/\r\n/g, "\n").split("\n");
  const files: ParsedFilePatch[] = [];
  let current: ParsedFilePatch | undefined;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (line.startsWith("rename from ") || line.startsWith("rename to ")) {
      throw new Error("Rename-only patches are not supported; use delete + create");
    }
    if (line.startsWith("--- ")) {
      const next = lines[index + 1] ?? "";
      if (!next.startsWith("+++ ")) throw new Error("Malformed unified diff: missing +++ path");
      const oldPath = cleanPath(line.slice(4));
      const newPath = cleanPath(next.slice(4));
      const path = newPath ?? oldPath;
      if (!path) throw new Error("Malformed unified diff: missing file path");
      current = {
        oldPath,
        newPath,
        path,
        operation: operation(oldPath, newPath),
        hunks: [],
        additions: 0,
        deletions: 0
      };
      files.push(current);
      index += 1;
      continue;
    }
    if (line.startsWith("+++ ")) {
      const newPath = cleanPath(line.slice(4));
      if (!newPath) throw new Error("Malformed unified diff: missing file path");
      current = {
        oldPath: null,
        newPath,
        path: newPath,
        operation: "create",
        hunks: [],
        additions: 0,
        deletions: 0
      };
      files.push(current);
      continue;
    }
    if (line.startsWith("@@ ")) {
      if (!current) throw new Error("Malformed unified diff: hunk before file header");
      const match = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line);
      if (!match) throw new Error(`Malformed hunk header: ${line}`);
      const hunk: ParsedHunk = {
        oldStart: Number.parseInt(match[1] ?? "1", 10),
        oldLines: Number.parseInt(match[2] ?? "1", 10),
        newStart: Number.parseInt(match[3] ?? "1", 10),
        newLines: Number.parseInt(match[4] ?? "1", 10),
        lines: []
      };
      index += 1;
      for (; index < lines.length; index += 1) {
        const hunkLine = lines[index] ?? "";
        if (hunkLine.startsWith("@@ ") || hunkLine.startsWith("--- ")) {
          index -= 1;
          break;
        }
        if (!hunkLine) continue;
        const marker = hunkLine[0];
        if (![" ", "+", "-", "\\"].includes(marker ?? "")) {
          throw new Error(`Malformed hunk line: ${hunkLine}`);
        }
        hunk.lines.push(hunkLine);
        if (marker === "+") current.additions += 1;
        if (marker === "-") current.deletions += 1;
      }
      current.hunks.push(hunk);
    }
  }
  if (files.length === 0 && diff.trim()) throw new Error("No unified diff file headers found");
  return files;
}
