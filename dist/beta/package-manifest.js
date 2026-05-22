import { join } from "node:path";
import { readJson } from "../utils/fs.js";
export async function readPackageManifestSummary(cwd) {
    const pkg = await readJson(join(cwd, "package.json"));
    return {
        name: pkg.name ?? null,
        version: pkg.version ?? null,
        bin: pkg.bin?.vibe ?? null,
        files: pkg.files ?? []
    };
}
//# sourceMappingURL=package-manifest.js.map