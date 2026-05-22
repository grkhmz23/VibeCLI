import { appendTransparencyEntry, generateTransparencyEntry, verifyTransparencyLog } from "../remote-attestation/transparency.js";
export function registerTransparencyCommand(program) {
    const command = program.command("transparency").description("Manage local transparency entries");
    command.argument("[run-id]", "run id").action(async (runId) => {
        if (!runId)
            throw new Error("Usage: vibe transparency <run-id>");
        console.log(JSON.stringify(await generateTransparencyEntry(process.cwd(), runId), null, 2));
    });
    command
        .command("append")
        .argument("<run-id>", "run id")
        .option("--confirm <confirm>", "exact confirmation")
        .action(async (runId, options) => {
        console.log(JSON.stringify(await appendTransparencyEntry(process.cwd(), runId, options.confirm), null, 2));
    });
    command
        .command("verify")
        .argument("[run-id]", "run id")
        .option("--json", "print JSON")
        .action(async (runId, options) => {
        const result = await verifyTransparencyLog(process.cwd(), runId);
        console.log(options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2));
        if (!result.ok)
            process.exitCode = 1;
    });
}
//# sourceMappingURL=transparency.js.map