import { join } from "node:path";
import { pathExists, readJson, writeJson } from "../utils/fs.js";
import type { BetaWarningRecord } from "./types.js";

export type BetaWarningAcceptances = {
  updatedAt: string;
  warnings: Record<
    string,
    {
      status: "accepted" | "resolved";
      by: string;
      reason: string;
      at: string;
    }
  >;
};

export const acceptancesPath = ".vibecli/beta/reports/BETA_WARNING_ACCEPTANCES.json";

export async function readWarningAcceptances(cwd: string): Promise<BetaWarningAcceptances> {
  const path = join(cwd, acceptancesPath);
  return pathExists(path)
    ? readJson<BetaWarningAcceptances>(path)
    : { updatedAt: new Date().toISOString(), warnings: {} };
}

export async function writeWarningAcceptances(
  cwd: string,
  acceptances: BetaWarningAcceptances
): Promise<void> {
  await writeJson(join(cwd, acceptancesPath), acceptances);
}

export function applyAcceptances(
  warnings: BetaWarningRecord[],
  acceptances: BetaWarningAcceptances
): BetaWarningRecord[] {
  return warnings.map((warning) => {
    const acceptance = acceptances.warnings[warning.id];
    if (!acceptance) return warning;
    return {
      ...warning,
      status: acceptance.status,
      acceptedBy: acceptance.by,
      acceptanceReason: acceptance.reason,
      acceptedAt: acceptance.at
    };
  });
}
