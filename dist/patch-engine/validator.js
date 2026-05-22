import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { validatePatchContent, validateSourcePath } from "../tools/source-write-policy.js";
import { pathExists } from "../utils/fs.js";
import { applyParsedPatchToContent } from "./apply.js";
import { parseUnifiedDiff } from "./parser.js";
export async function validateUnifiedDiff(args) {
    const entries = [];
    try {
        validatePatchContent(args.diff);
        const parsed = parseUnifiedDiff(args.diff);
        for (const file of parsed) {
            const errors = [];
            try {
                validateSourcePath(file.path, {
                    repoRoot: args.repoRoot,
                    allowLockfiles: args.allowLockfiles
                });
                const fullPath = join(args.repoRoot, file.path);
                if (file.operation === "modify" && !pathExists(fullPath))
                    errors.push("modify target does not exist");
                if (file.operation === "create" && pathExists(fullPath))
                    errors.push("create target already exists");
                if (file.operation === "modify" && errors.length === 0) {
                    applyParsedPatchToContent(await readFile(fullPath, "utf8"), file);
                }
            }
            catch (error) {
                errors.push(error instanceof Error ? error.message : String(error));
            }
            entries.push({
                path: file.path,
                ok: errors.length === 0,
                operation: file.operation,
                additions: file.additions,
                deletions: file.deletions,
                hunks: file.hunks.length,
                errors
            });
        }
    }
    catch (error) {
        entries.push({
            path: "unknown",
            ok: false,
            operation: "unknown",
            additions: 0,
            deletions: 0,
            hunks: 0,
            errors: [error instanceof Error ? error.message : String(error)]
        });
    }
    return entries;
}
//# sourceMappingURL=validator.js.map