import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";

export async function sha256File(path: string): Promise<{ sha256: string; sizeBytes: number }> {
  const data = await readFile(path);
  const info = await stat(path);
  return { sha256: createHash("sha256").update(data).digest("hex"), sizeBytes: info.size };
}

export function sha256Text(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
