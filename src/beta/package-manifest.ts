import { join } from "node:path";
import { readJson } from "../utils/fs.js";

export type PackageManifestSummary = {
  name: string | null;
  version: string | null;
  bin: string | null;
  files: string[];
};

export async function readPackageManifestSummary(cwd: string): Promise<PackageManifestSummary> {
  const pkg = await readJson<{
    name?: string;
    version?: string;
    bin?: Record<string, string>;
    files?: string[];
  }>(join(cwd, "package.json"));
  return {
    name: pkg.name ?? null,
    version: pkg.version ?? null,
    bin: pkg.bin?.vibe ?? null,
    files: pkg.files ?? []
  };
}
