export type PatchOperation = "create" | "modify" | "delete";
export type ParsedHunk = {
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: string[];
};
export type ParsedFilePatch = {
    oldPath: string | null;
    newPath: string | null;
    path: string;
    operation: PatchOperation;
    hunks: ParsedHunk[];
    additions: number;
    deletions: number;
};
export type PatchPreview = {
    filesChanged: string[];
    additions: number;
    deletions: number;
    hunks: number;
};
export type PatchValidationEntry = {
    path: string;
    ok: boolean;
    operation: string;
    additions: number;
    deletions: number;
    hunks: number;
    errors: string[];
};
