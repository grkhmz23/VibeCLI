import type { ParsedFilePatch } from "./types.js";
export declare function applyParsedPatchToContent(original: string, patch: ParsedFilePatch): string;
export declare function applyParsedFilePatch(repoRoot: string, patch: ParsedFilePatch): Promise<void>;
