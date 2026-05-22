export type ScannerStatus = "pass" | "fail" | "warning" | "skipped";
export type ScannerSeverity = "low" | "medium" | "high" | "critical";

export type ScannerFinding = {
  severity: ScannerSeverity;
  file: string | null;
  message: string;
  recommendation: string;
};

export type ScannerResult = {
  scanner: string;
  status: ScannerStatus;
  findings: ScannerFinding[];
};

export type ScannerContext = {
  repoRoot: string;
  filesChanged: string[];
};
