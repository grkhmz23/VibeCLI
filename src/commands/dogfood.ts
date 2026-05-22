import type { Command } from "commander";
import { cleanDogfoodFixtures, createDogfoodFixtures } from "../dogfood/fixture-writer.js";
import { createDogfoodPlan, runDogfood } from "../dogfood/runner.js";
import { latestDogfoodReport } from "../dogfood/report.js";
import type { DogfoodFixtureType } from "../dogfood/types.js";

export function registerDogfoodCommand(program: Command): void {
  const dogfood = program.command("dogfood").description("Run local dogfood QA workflows");
  dogfood
    .command("plan")
    .option("--write-fixtures", "also create fixture repos")
    .option("--json", "print JSON")
    .action(async (options: { writeFixtures?: boolean; json?: boolean }) => {
      const result = await createDogfoodPlan(process.cwd(), {
        writeFixtures: options.writeFixtures
      });
      console.log(
        options.json
          ? JSON.stringify(result, null, 2)
          : `Dogfood matrix: ${result.matrix.join(", ")}\nProvider calls: no`
      );
    });
  dogfood
    .command("fixtures")
    .option("--clean", "clean generated fixture workspaces")
    .option("--confirm <value>", "exact confirmation")
    .option("--json", "print JSON")
    .action(async (options: { clean?: boolean; confirm?: string; json?: boolean }) => {
      if (options.clean) {
        const result = await cleanDogfoodFixtures(process.cwd(), options.confirm);
        console.log(
          options.json
            ? JSON.stringify(result, null, 2)
            : `Dogfood fixtures cleaned: ${result.path}`
        );
        return;
      }
      const result = await createDogfoodFixtures(process.cwd());
      console.log(
        options.json
          ? JSON.stringify(result, null, 2)
          : `Dogfood fixtures created: ${result.fixtures.length} in ${result.root}`
      );
    });
  dogfood
    .command("run")
    .option("--fixture <name>", "run one fixture")
    .option("--apply-fixture-patches", "apply generated patches inside dogfood fixtures only")
    .option("--confirm <value>", "exact confirmation")
    .option("--json", "print JSON")
    .action(
      async (options: {
        fixture?: DogfoodFixtureType;
        applyFixturePatches?: boolean;
        confirm?: string;
        json?: boolean;
      }) => {
        const result = await runDogfood(process.cwd(), {
          fixture: options.fixture,
          applyFixturePatches: options.applyFixturePatches,
          confirm: options.confirm
        });
        console.log(
          options.json
            ? JSON.stringify(result, null, 2)
            : `Dogfood ${result.dogfoodRunId}: ${result.summary.passed}/${result.summary.total} passed`
        );
      }
    );
  dogfood
    .command("report")
    .option("--json", "print JSON")
    .action(async (options: { json?: boolean }) => {
      const report = await latestDogfoodReport(process.cwd());
      if (!report) {
        console.log("No dogfood report found.");
        return;
      }
      console.log(
        options.json
          ? JSON.stringify(report, null, 2)
          : `Dogfood ${report.dogfoodRunId}: ${report.summary.passed}/${report.summary.total} passed`
      );
    });
}
