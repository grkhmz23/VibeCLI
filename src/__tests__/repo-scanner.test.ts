import { mkdir, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { scanRepoContext } from "../context/repo-scanner.js";

async function repo(): Promise<string> {
  return mkdtemp(join(tmpdir(), "vibecli-scan-"));
}

describe("repo scanner", () => {
  it("detects package manager and scripts from package.json", async () => {
    const cwd = await repo();
    await writeFile(
      join(cwd, "package.json"),
      JSON.stringify({
        scripts: { test: "vitest", build: "tsc", lint: "eslint ." },
        dependencies: { vite: "x" }
      })
    );
    await writeFile(join(cwd, "pnpm-lock.yaml"), "");
    const context = await scanRepoContext(cwd);
    expect(context.packageManager).toBe("pnpm");
    expect(context.packageScripts.test).toBe("vitest");
    expect(context.detectedFrameworks).toContain("Vite");
  });

  it("ignores node_modules, .git, dist, build, and .next", async () => {
    const cwd = await repo();
    for (const dir of ["node_modules", ".git", "dist", "build", ".next"]) {
      await mkdir(join(cwd, dir), { recursive: true });
      await writeFile(join(cwd, dir, "ignored.ts"), "");
    }
    await writeFile(join(cwd, "src.ts"), "");
    const context = await scanRepoContext(cwd);
    expect(context.sourceFilesCount).toBe(1);
  });

  it("detects .env.example, README, and SECURITY.md", async () => {
    const cwd = await repo();
    await writeFile(join(cwd, ".env.example"), "");
    await writeFile(join(cwd, "README.md"), "");
    await writeFile(join(cwd, "SECURITY.md"), "");
    const context = await scanRepoContext(cwd);
    expect(context.hasEnvExample).toBe(true);
    expect(context.hasReadme).toBe(true);
    expect(context.hasSecurityMd).toBe(true);
  });
});
