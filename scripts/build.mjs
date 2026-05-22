#!/usr/bin/env node
import { chmodSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const tscBin = join(root, "node_modules", "typescript", "bin", "tsc");
const distBin = join(root, "dist", "index.js");

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: false
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!existsSync(tscBin)) {
  console.error("TypeScript build tool not found; using npm exec for npm git prepare.");
  run("npm", [
    "exec",
    "--yes",
    "--package",
    "typescript@^5.7.2",
    "--",
    "tsc",
    "-p",
    "tsconfig.build.json"
  ]);
} else {
  run(process.execPath, [tscBin, "-p", "tsconfig.build.json"]);
}
chmodSync(distBin, 0o755);
