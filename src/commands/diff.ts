import type { Command } from "commander";
import { checkRunDiffs, diffStat, readPatchDiffs } from "../orchestrator/diff.js";
import { RunStore } from "../orchestrator/run-store.js";

export function registerDiffCommand(program: Command): void {
  program
    .command("diff")
    .argument("<run-id>", "run id")
    .option("--stat", "show diff stats")
    .option("--check", "parse and validate proposed patches")
    .option("--json", "print JSON")
    .description("Preview proposed patch diff")
    .action(async (runId: string, options: { stat?: boolean; check?: boolean; json?: boolean }) => {
      if (options.check) {
        const result = await checkRunDiffs(process.cwd(), runId);
        console.log(
          options.json
            ? JSON.stringify(result, null, 2)
            : result.patches
                .map(
                  (patch) =>
                    `${patch.ok ? "PASS" : "FAIL"} ${patch.path}: ${patch.errors.join("; ") || "ok"}`
                )
                .join("\n")
        );
        return;
      }
      if (options.stat) {
        const stats = await diffStat(process.cwd(), runId);
        console.log(
          options.json
            ? JSON.stringify(stats, null, 2)
            : stats.map((s) => `${s.path.padEnd(32)} +${s.added} -${s.removed}`).join("\n")
        );
        return;
      }
      const diff = await readPatchDiffs(new RunStore(process.cwd()), runId);
      console.log(options.json ? JSON.stringify({ runId, diff }, null, 2) : diff);
    });
}
