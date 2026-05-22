import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import { pathExists } from "../utils/fs.js";
import { RunStore } from "../orchestrator/run-store.js";
import { generatePrDescription } from "../handoff/pr-description.js";
import { createHandoffBundle } from "../handoff/bundle.js";
import { verifyLedger } from "../ledger/verify.js";
import { githubDoctor, runGh } from "./gh.js";
import type { GitHubPrResult } from "./types.js";

const execFileAsync = promisify(execFile);

export async function githubPr(
  cwd: string,
  runId: string,
  options: {
    create?: boolean;
    push?: boolean;
    confirm?: string;
    allowLedgerWarning?: boolean;
    allowRisk?: boolean;
    allowUnverified?: boolean;
    allowMainBranch?: boolean;
    allowDirty?: boolean;
  } = {}
): Promise<GitHubPrResult> {
  const store = new RunStore(cwd);
  const doctor = await githubDoctor(cwd);
  const state = await store.readState(runId);
  if (!pathExists(join(store.runPath(runId), "handoff", "PR_DESCRIPTION.md"))) {
    await createHandoffBundle(cwd, runId);
  }
  const pr = await generatePrDescription(cwd, runId);
  const result: GitHubPrResult = {
    runId,
    createdAt: new Date().toISOString(),
    mode: "dry_summary",
    remote: doctor.remote,
    branch: doctor.branch,
    title: pr.title,
    bodyPath: pr.path,
    prUrl: null,
    warnings: doctor.messages,
    errors: []
  };
  if (!options.create && !options.push) {
    await store.writeArtifact(runId, "github-pr.json", result);
    return result;
  }
  const expected = options.push ? `PUSH AND CREATE PR ${runId}` : `CREATE PR ${runId}`;
  if (options.confirm !== expected)
    throw new Error(`GitHub PR creation requires exact confirmation: ${expected}`);
  const ledger = await verifyLedger(cwd, runId).catch(() => undefined);
  if (!ledger?.ok && !options.allowLedgerWarning)
    throw new Error("Refusing PR creation because ledger verification failed.");
  if ((state.scanners?.criticalFindings || state.scanners?.highFindings) && !options.allowRisk) {
    throw new Error("Refusing PR creation because high/critical scanner findings exist.");
  }
  if (state.verification?.status !== "passed" && !options.allowUnverified) {
    throw new Error("Refusing PR creation because verification has not passed.");
  }
  if ((doctor.branch === "main" || doctor.branch === "master") && !options.allowMainBranch) {
    throw new Error("Refusing PR creation from main/master branch.");
  }
  if (options.push) {
    const dirty = await execFileAsync("git", ["status", "--short"], { cwd }).then(({ stdout }) =>
      stdout.trim()
    );
    if (dirty && !options.allowDirty) throw new Error("Refusing push with uncommitted changes.");
    if (!doctor.branch) throw new Error("Cannot push without a current branch.");
    await execFileAsync("git", ["push", "-u", "origin", doctor.branch], { cwd });
  }
  try {
    const created = await runGh(
      [
        "pr",
        "create",
        "--title",
        pr.title,
        "--body-file",
        join(store.runPath(runId), "handoff", "PR_DESCRIPTION.md")
      ],
      cwd
    );
    result.mode = "created";
    result.prUrl = created.stdout.trim() || null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/push|upstream|not.*pushed/i.test(message) && doctor.branch) {
      result.mode = "push_required";
      result.warnings.push(`Run: git push -u origin ${doctor.branch}`);
    } else {
      result.mode = "failed";
      result.errors.push(message);
    }
  }
  await store.writeArtifact(runId, "github-pr.json", result);
  state.lifecycle = {
    ...state.lifecycle,
    branch: state.lifecycle?.branch ?? { proposed: null, current: doctor.branch, created: false },
    commit: state.lifecycle?.commit ?? { status: "not_started" },
    pr: {
      status:
        result.mode === "created" ? "created" : result.mode === "failed" ? "failed" : "dry_summary",
      url: result.prUrl ?? undefined,
      updatedAt: result.createdAt
    },
    feedback: state.lifecycle?.feedback ?? { status: "not_started" },
    mergeReadiness: state.lifecycle?.mergeReadiness ?? { verdict: "not_started" }
  };
  await store.writeState(state);
  return result;
}
