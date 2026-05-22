#!/usr/bin/env node
import { chmodSync, existsSync } from "node:fs";
import { join } from "node:path";

const distBin = join(process.cwd(), "dist", "index.js");

if (!existsSync(distBin)) {
  console.error("dist/index.js is missing. Run npm run build before installing from git.");
  process.exit(1);
}

chmodSync(distBin, 0o755);
