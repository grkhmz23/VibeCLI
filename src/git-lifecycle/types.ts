export type BranchResult = {
  runId: string;
  createdAt: string;
  mode: "preview" | "created" | "switched_existing" | "failed";
  branch: string;
  previousBranch: string | null;
  currentBranch: string | null;
  warnings: string[];
  errors: string[];
};

export type CommitMessageResult = {
  runId: string;
  createdAt: string;
  style: "conventional" | "plain";
  subject: string;
  body: string;
  filesChanged: string[];
  verificationStatus: string | null;
  scannerStatus: string | null;
  policy: string | null;
  warnings: string[];
};

export type CommitResult = {
  runId: string;
  createdAt: string;
  mode: "preview" | "created" | "failed";
  branch: string | null;
  commitSha: string | null;
  subject: string;
  filesStaged: string[];
  filesRejected: Array<{ path: string; reason: string }>;
  warnings: string[];
  errors: string[];
};
