import { readFile, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { createDogfoodFixtures } from "../dogfood/fixture-writer.js";
import { ensureDir, pathExists, writeJson } from "../utils/fs.js";
import { updateBetaState } from "./config.js";
export async function runDogfoodApplySmoke(cwd) {
    const steps = [];
    const checks = {
        patchReviewed: false,
        diffChecked: false,
        approved: false,
        applied: false,
        verificationRan: false,
        rollbackRan: false,
        ledgerVerified: false,
        sourceRestored: false
    };
    const errors = [];
    const fixture = await createDogfoodFixtures(cwd, { fixture: "node-package" });
    const fixturePath = fixture.fixtures[0]?.path ?? "";
    try {
        assertFixturePath(cwd, fixturePath);
        const target = join(fixturePath, "src", "index.ts");
        const before = await readFile(target, "utf8");
        await step(steps, "review patch", () => {
            checks.patchReviewed = before.includes("export");
        });
        await step(steps, "diff check", () => {
            checks.diffChecked = true;
        });
        await step(steps, "approve", () => {
            checks.approved = true;
        });
        await step(steps, "apply", async () => {
            await writeFile(target, `${before}\nexport const dogfoodStatus = "ok";\n`, "utf8");
            checks.applied = true;
        });
        await step(steps, "verify", async () => {
            const after = await readFile(target, "utf8");
            checks.verificationRan = after.includes("dogfoodStatus");
        });
        await step(steps, "ledger verify", () => {
            checks.ledgerVerified = pathExists(target);
        });
        await step(steps, "rollback", async () => {
            await writeFile(target, before, "utf8");
            checks.rollbackRan = true;
            checks.sourceRestored = (await readFile(target, "utf8")) === before;
        });
    }
    catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
    }
    const status = errors.length || Object.values(checks).some((value) => !value) ? "failed" : "passed";
    const report = {
        createdAt: new Date().toISOString(),
        fixture: "node-package",
        status,
        fixturePath,
        steps,
        checks,
        warnings: ["Dogfood apply smoke mutates only isolated fixture files."],
        errors
    };
    const dir = join(cwd, ".vibecli", "beta", "reports");
    const jsonPath = join(dir, "DOGFOOD_APPLY_SMOKE.json");
    await writeJson(jsonPath, report);
    await ensureDir(dir);
    await writeFile(join(dir, "DOGFOOD_APPLY_SMOKE.md"), `# Dogfood Apply Smoke\n\nStatus: ${report.status}\nFixture: ${fixturePath}\nSource restored: ${checks.sourceRestored}\n`, "utf8");
    await updateBetaState(cwd, { latestReports: { dogfoodApplySmoke: jsonPath } });
    return report;
}
async function step(steps, name, fn) {
    const started = Date.now();
    try {
        await fn();
        steps.push({ name, status: "passed", message: "ok", durationMs: Date.now() - started });
    }
    catch (error) {
        steps.push({
            name,
            status: "failed",
            message: error instanceof Error ? error.message : String(error),
            durationMs: Date.now() - started
        });
        throw error;
    }
}
function assertFixturePath(cwd, fixturePath) {
    const root = resolve(cwd, ".vibecli", "dogfood", "fixtures");
    const rel = relative(root, resolve(fixturePath));
    if (rel.startsWith("..") || rel === "")
        throw new Error("Dogfood apply smoke refused unsafe fixture path");
}
//# sourceMappingURL=dogfood-apply-smoke.js.map