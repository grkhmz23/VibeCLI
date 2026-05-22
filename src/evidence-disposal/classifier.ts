import { basename } from "node:path";

export function classifyDisposalPath(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const name = basename(normalized);
  if (normalized.includes("/.git/") || normalized.startsWith(".git/")) return "git";
  if (normalized.endsWith(".private.pem") || /private[-_]?key/i.test(name)) return "private-keys";
  if (/^\.env($|\.)|\/\.env($|\.)/.test(normalized) && !normalized.endsWith(".env.example")) {
    return "env-files";
  }
  if (normalized.includes("org/keys/")) return "org-keys";
  if (normalized.includes(".vibecli/keys/") || normalized.includes("provenance-key")) {
    return "provenance-keys";
  }
  if (/\.tar\.gz$|\.zip$|archive/i.test(normalized)) return "archives";
  if (/^(src|lib|app|packages|docs)\//.test(normalized) || /package(-lock)?\.json$/.test(name)) {
    return "source-code";
  }
  if (normalized.startsWith("ledger-manifest.json")) return "run-ledger";
  if (normalized.startsWith("evidence-lifecycle/disposal/")) return "disposal";
  if (normalized.startsWith("evidence-lifecycle/")) return "evidence-lifecycle";
  if (normalized.startsWith("agent-outputs/") || normalized === "agent-events.jsonl")
    return "raw-run";
  if (normalized.startsWith("agents/")) return "raw-run";
  if (normalized.startsWith("patches/")) return "patches";
  if (normalized.startsWith("rollback/")) return "rollback";
  if (normalized.startsWith("provenance/")) return "provenance";
  if (normalized.startsWith("evidence/")) return "evidence";
  if (normalized.startsWith("audit/")) return "audit";
  if (normalized.startsWith("org/")) return "organization";
  if (normalized.startsWith("release/")) return "release";
  return "run-evidence";
}

export function isProtectedDisposalPath(path: string): boolean {
  const normalized = path.replace(/\\/g, "/");
  const disposalClass = classifyDisposalPath(normalized);
  return (
    [
      "git",
      "private-keys",
      "env-files",
      "org-keys",
      "provenance-keys",
      "archives",
      "source-code",
      "run-ledger"
    ].includes(disposalClass) ||
    normalized === "state.json" ||
    normalized === "input.json" ||
    normalized.startsWith("evidence-lifecycle/disposal/") ||
    normalized.startsWith("evidence-lifecycle/LEGAL_HOLD") ||
    normalized.startsWith("evidence-lifecycle/EVIDENCE_ARCHIVE_POINTER")
  );
}

export function conservativeCandidateReason(path: string): string | null {
  const normalized = path.replace(/\\/g, "/");
  if (isProtectedDisposalPath(normalized)) return null;
  if (normalized.startsWith("agent-outputs/"))
    return "Archived raw agent output can be locally disposed.";
  if (normalized.startsWith("agents/"))
    return "Archived raw agent artifact can be locally disposed.";
  if (normalized === "agent-events.jsonl") return "Archived event log can be locally disposed.";
  if (normalized === "final-report.md")
    return "Archived generated run report can be locally disposed.";
  if (normalized === "repo-context.json")
    return "Archived repository context snapshot can be locally disposed.";
  if (normalized === "routing-plan.json") return "Archived routing plan can be locally disposed.";
  return null;
}
