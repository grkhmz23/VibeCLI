import { rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { loadConfig } from "../config/config.js";
import { ensureDir, pathExists } from "../utils/fs.js";
import type { DogfoodFixtureType } from "./types.js";
import { fixtureDefinition } from "./fixtures.js";
import { initFixtureGit } from "./fixture-git.js";

export type FixtureWriteResult = {
  createdAt: string;
  root: string;
  fixtures: Array<{ type: DogfoodFixtureType; path: string; gitInitialized: boolean }>;
};

function assertUnder(parent: string, child: string): void {
  const rel = relative(resolve(parent), resolve(child));
  if (rel.startsWith("..") || resolve(child) === resolve(parent)) {
    throw new Error(`Refusing unsafe dogfood fixture path: ${child}`);
  }
}

export async function createDogfoodFixtures(
  cwd: string,
  options: { fixture?: DogfoodFixtureType } = {}
): Promise<FixtureWriteResult> {
  const config = await loadConfig(cwd);
  const createdAt = new Date().toISOString();
  const stamp = createdAt.replace(/[-:.TZ]/g, "").slice(0, 14);
  const root = join(cwd, config.dogfood.fixtures_dir, stamp);
  await ensureDir(root);
  const matrix = options.fixture ? [options.fixture] : config.dogfood.default_matrix;
  const fixtures: FixtureWriteResult["fixtures"] = [];
  for (const type of matrix) {
    const definition = fixtureDefinition(type);
    const fixtureRoot = join(root, type);
    assertUnder(join(cwd, config.dogfood.fixtures_dir), fixtureRoot);
    for (const file of definition.files) {
      const target = join(fixtureRoot, file.path);
      assertUnder(fixtureRoot, target);
      await ensureDir(dirname(target));
      await writeFile(target, file.content, "utf8");
    }
    const gitInitialized = await initFixtureGit(fixtureRoot);
    fixtures.push({ type, path: fixtureRoot, gitInitialized });
  }
  return { createdAt, root, fixtures };
}

export async function cleanDogfoodFixtures(
  cwd: string,
  confirm?: string
): Promise<{ cleaned: boolean; path: string }> {
  if (confirm !== "CLEAN DOGFOOD FIXTURES") {
    throw new Error('Fixture cleanup requires exact confirmation: "CLEAN DOGFOOD FIXTURES"');
  }
  const config = await loadConfig(cwd);
  const fixturesDir = join(cwd, config.dogfood.fixtures_dir);
  const rel = relative(resolve(cwd, ".vibecli", "dogfood", "fixtures"), resolve(fixturesDir));
  if (rel.startsWith("..") || resolve(fixturesDir) === resolve(cwd)) {
    throw new Error("Refusing to clean fixtures outside .vibecli/dogfood/fixtures");
  }
  if (pathExists(fixturesDir)) await rm(fixturesDir, { recursive: true, force: true });
  await ensureDir(fixturesDir);
  return { cleaned: true, path: fixturesDir };
}
