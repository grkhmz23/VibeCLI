import { previewLiveSmoke, runLiveRcSmoke, runLiveSmoke } from "../dogfood/live-smoke.js";
export function registerLiveSmokeCommand(program) {
    program
        .command("live-smoke")
        .option("--provider <provider>", "provider name")
        .option("--model <model>", "model id")
        .option("--profile <name>", "profile name")
        .option("--rc", "run exact-confirmed beta RC live smoke")
        .option("--confirm <value>", "exact confirmation")
        .option("--json", "print JSON")
        .description("Preview or exact-confirm a tiny live provider smoke")
        .action(async (options) => {
        const result = options.rc && options.confirm
            ? await runLiveRcSmoke(process.cwd(), options)
            : options.confirm
                ? await runLiveSmoke(process.cwd(), options)
                : await previewLiveSmoke(process.cwd(), { profile: options.profile });
        console.log(options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2));
    });
}
//# sourceMappingURL=live-smoke.js.map