#!/usr/bin/env node
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  realpathSync,
  renameSync,
  rmSync
} from "node:fs";
import { spawnSync } from "node:child_process";
import { basename, dirname, join, resolve } from "node:path";

const packageName = "vibecli";
const root = process.cwd();
const prefix = process.env.npm_config_prefix;
const isGlobal = process.env.npm_config_global === "true";

if (!prefix || !isGlobal || process.platform === "win32") {
  process.exit(0);
}

const globalPackagePath = join(prefix, "lib", "node_modules", packageName);

if (!existsSync(globalPackagePath)) {
  process.exit(0);
}

const linkStat = lstatSync(globalPackagePath);

if (!linkStat.isSymbolicLink()) {
  process.exit(0);
}

const linkTarget = realpathSync(globalPackagePath);

if (resolve(linkTarget) !== resolve(root)) {
  process.exit(0);
}

const stagingPath = join(
  dirname(globalPackagePath),
  `.${basename(globalPackagePath)}-install-copy-${process.pid}`
);
const blockedNames = new Set([
  ".git",
  ".vibecli",
  ".env",
  "coverage",
  ".npm-cache",
  ".pnpm-cache",
  ".pnpm-data"
]);

rmSync(stagingPath, { force: true, recursive: true });
mkdirSync(stagingPath, { recursive: true });
cpSync(root, stagingPath, {
  dereference: false,
  errorOnExist: false,
  filter: (source) => {
    const name = basename(source);
    if (blockedNames.has(name)) {
      return false;
    }
    return !name.endsWith(".tgz");
  },
  recursive: true
});
rmSync(globalPackagePath, { force: true });
renameSync(stagingPath, globalPackagePath);

const result = spawnSync(
  "npm",
  ["install", "--omit=dev", "--ignore-scripts", "--no-audit", "--no-fund", "--package-lock=false"],
  {
    cwd: globalPackagePath,
    stdio: "inherit",
    shell: false
  }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
