import type { ReviewerImportPreview } from "./types.js";
export declare function previewReviewerImport(cwd: string, file: string, options?: {
    allowRawEmail?: boolean;
    confirm?: string;
}): Promise<ReviewerImportPreview>;
export declare function applyReviewerImport(cwd: string, file: string, options?: {
    confirm?: string;
    allowRawEmail?: boolean;
    rawEmailConfirm?: string;
}): Promise<ReviewerImportPreview>;
