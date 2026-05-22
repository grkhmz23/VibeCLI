import { loadConfig } from "../config/config.js";
import { applyReviewerImport, previewReviewerImport } from "../audit/reviewer-import.js";
import { readReviewerDirectoryFile } from "../audit/reviewer-directory.js";
export function registerReviewerDirectoryCommand(program) {
    const command = program
        .command("reviewer-directory")
        .description("Import local reviewer directory files");
    command
        .command("import")
        .requiredOption("--file <path>", "local reviewer directory file")
        .option("--apply", "apply preview to organization reviewers")
        .option("--confirm <confirm>", "exact confirmation")
        .option("--allow-raw-email", "permit raw email import after hashing")
        .option("--raw-email-confirm <confirm>", "exact raw email confirmation")
        .option("--json", "print JSON")
        .action(async (options) => {
        const result = options.apply
            ? await applyReviewerImport(process.cwd(), options.file, {
                confirm: options.confirm,
                allowRawEmail: options.allowRawEmail,
                rawEmailConfirm: options.rawEmailConfirm
            })
            : await previewReviewerImport(process.cwd(), options.file, {
                allowRawEmail: options.allowRawEmail,
                confirm: options.rawEmailConfirm
            });
        console.log(options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2));
    });
    command
        .command("list")
        .option("--json", "print JSON")
        .action(async (options) => {
        const reviewers = (await loadConfig(process.cwd())).organization.reviewers;
        console.log(options.json
            ? JSON.stringify(reviewers, null, 2)
            : reviewers.map((reviewer) => `${reviewer.id}\t${reviewer.roles.join(",")}`).join("\n"));
    });
    command
        .command("validate")
        .requiredOption("--file <path>", "local reviewer directory file")
        .option("--json", "print JSON")
        .action(async (options) => {
        const result = await readReviewerDirectoryFile(process.cwd(), options.file);
        console.log(options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2));
        if (result.errors.length)
            process.exitCode = 1;
    });
}
//# sourceMappingURL=reviewer-directory.js.map