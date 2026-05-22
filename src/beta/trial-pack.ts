import { readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ensureDir, pathExists, readJson, writeJson } from "../utils/fs.js";

export type BetaTrialTarget =
  | "solo-developer"
  | "startup-team"
  | "agency"
  | "security-reviewer"
  | "custom";

export type BetaTrialSummary = {
  trialId: string;
  createdAt: string;
  targetUser: BetaTrialTarget;
  recommendedWorkflow: string[];
  safetyNotes: string[];
  feedbackQuestions: string[];
  knownLimitations: string[];
};

export async function createBetaTrialPack(
  cwd: string,
  target: BetaTrialTarget = "solo-developer"
): Promise<BetaTrialSummary> {
  const createdAt = new Date().toISOString();
  const trialId = `trial-${createdAt.replace(/[-:.TZ]/g, "").slice(0, 14)}`;
  const dir = join(cwd, ".vibecli", "beta", "trials", trialId);
  const summary: BetaTrialSummary = {
    trialId,
    createdAt,
    targetUser: target,
    recommendedWorkflow: [
      "vibe init",
      "vibe doctor",
      'vibe run "small safe change"',
      "vibe review <run-id>",
      "vibe beta-check"
    ],
    safetyNotes: [
      "Start with dry-run; live providers are optional.",
      "Live provider calls require exact confirmation.",
      "Do not test publish, deploy, push, merge, or release creation."
    ],
    feedbackQuestions: [
      "Was install and first run clear?",
      "Were approval prompts understandable?",
      "Which command output was confusing?",
      "Did any artifact contain information you did not expect?"
    ],
    knownLimitations: [
      "Beta RC is not a production-ready claim.",
      "No hosted service, deployment automation, or package publishing is implemented.",
      "Optional scanner and live-provider validation may require local setup."
    ]
  };
  await ensureDir(dir);
  await writeJson(join(dir, "BETA_TRIAL_SUMMARY.json"), summary);
  await writeFile(join(dir, "BETA_TRIAL_GUIDE.md"), guide(summary), "utf8");
  await writeFile(
    join(dir, "BETA_FEEDBACK_TEMPLATE.md"),
    "# Beta Feedback\n\n- What worked?\n- What failed?\n- What felt unsafe or unclear?\n",
    "utf8"
  );
  await writeFile(
    join(dir, "BETA_INCIDENT_TEMPLATE.md"),
    "# Beta Incident\n\n- Summary:\n- Command:\n- Expected:\n- Actual:\n- Local artifacts to attach:\n",
    "utf8"
  );
  await writeFile(
    join(dir, "BETA_TRIAL_CHECKLIST.md"),
    "# Trial Checklist\n\n- [ ] Install locally\n- [ ] Run dry-run workflow\n- [ ] Review safety prompts\n- [ ] Submit feedback template\n",
    "utf8"
  );
  return summary;
}

export async function listBetaTrials(
  cwd: string
): Promise<Array<{ trialId: string; path: string }>> {
  const root = join(cwd, ".vibecli", "beta", "trials");
  if (!pathExists(root)) return [];
  const entries = await readdir(root, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({ trialId: entry.name, path: join(root, entry.name) }));
}

export async function showBetaTrial(cwd: string, trialId: string): Promise<BetaTrialSummary> {
  const path = join(cwd, ".vibecli", "beta", "trials", trialId, "BETA_TRIAL_SUMMARY.json");
  return readJson<BetaTrialSummary>(path);
}

function guide(summary: BetaTrialSummary): string {
  return `# Beta Trial Guide\n\nTarget user: ${summary.targetUser}\n\n## Install\n\nUse the local package/install instructions from README. Run dry-run first.\n\n## Safety Model\n\nVibeCLI is local-first. Live providers are optional and exact-confirmed. Patch apply, rollback, release, and disposal commands use exact confirmations.\n\n## Workflow\n\n${summary.recommendedWorkflow.map((step) => `- \`${step}\``).join("\n")}\n\n## Do Not Test Yet\n\n- Package publishing\n- Deployments\n- Branch/tag pushes\n- GitHub release publication\n- Source or evidence upload\n\n## Known Limitations\n\n${summary.knownLimitations.map((item) => `- ${item}`).join("\n")}\n`;
}
