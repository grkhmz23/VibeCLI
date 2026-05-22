import type { ReviewerDirectoryEntry } from "./types.js";
export declare function readReviewerDirectoryFile(cwd: string, file: string, options?: {
    allowRawEmail?: boolean;
    confirm?: string;
}): Promise<{
    reviewers: ReviewerDirectoryEntry[];
    errors: string[];
    rawEmailsHashed: boolean;
}>;
