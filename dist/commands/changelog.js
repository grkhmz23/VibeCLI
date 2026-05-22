import { generateChangelogEntry, writeChangelog } from "../release/changelog.js";
export function registerChangelogCommand(program) {
    program
        .command("changelog")
        .argument("<run-id>", "run id")
        .option("--write", "write configured changelog file")
        .option("--confirm <confirm>", "exact confirmation")
        .option("--json", "print JSON")
        .description("Generate or write a governed changelog entry")
        .action(async (runId, options) => {
        const result = options.write
            ? await writeChangelog(process.cwd(), runId, { confirm: options.confirm })
            : await generateChangelogEntry(process.cwd(), runId);
        console.log(options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2));
    });
}
//# sourceMappingURL=changelog.js.map