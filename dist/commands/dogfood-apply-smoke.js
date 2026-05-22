import { runDogfoodApplySmoke } from "../beta/dogfood-apply-smoke.js";
export function registerDogfoodApplySmokeCommand(program) {
    program
        .command("dogfood-apply-smoke")
        .option("--confirm <value>", "optional exact confirmation")
        .option("--json", "print JSON")
        .description("Run isolated dogfood patch apply/rollback smoke")
        .action(async (options) => {
        const result = await runDogfoodApplySmoke(process.cwd());
        console.log(options.json
            ? JSON.stringify(result, null, 2)
            : `Dogfood apply smoke: ${result.status} (${result.fixturePath})`);
    });
}
//# sourceMappingURL=dogfood-apply-smoke.js.map