import { parseUnifiedDiff } from "./parser.js";
export function previewUnifiedDiff(diff) {
    const files = parseUnifiedDiff(diff);
    return {
        filesChanged: files.map((file) => file.path),
        additions: files.reduce((sum, file) => sum + file.additions, 0),
        deletions: files.reduce((sum, file) => sum + file.deletions, 0),
        hunks: files.reduce((sum, file) => sum + file.hunks.length, 0)
    };
}
//# sourceMappingURL=preview.js.map