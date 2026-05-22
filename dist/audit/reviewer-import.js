import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parse, stringify } from "yaml";
import { loadConfig, configPath } from "../config/config.js";
import { appendOrgAuditEvent } from "../org/audit-log.js";
import { ensureDir } from "../utils/fs.js";
import { readReviewerDirectoryFile } from "./reviewer-directory.js";
export async function previewReviewerImport(cwd, file, options = {}) {
    const config = await loadConfig(cwd);
    const parsed = await readReviewerDirectoryFile(cwd, file, options);
    const current = new Map(config.organization.reviewers.map((reviewer) => [reviewer.id, reviewer]));
    const seen = new Set();
    const duplicates = [];
    for (const reviewer of parsed.reviewers) {
        if (seen.has(reviewer.id))
            duplicates.push(reviewer.id);
        seen.add(reviewer.id);
    }
    const preview = {
        createdAt: new Date().toISOString(),
        file,
        reviewers: parsed.reviewers,
        toAdd: parsed.reviewers
            .filter((reviewer) => !current.has(reviewer.id) && reviewer.active)
            .map((reviewer) => reviewer.id),
        toUpdate: parsed.reviewers
            .filter((reviewer) => current.has(reviewer.id) && reviewer.active)
            .map((reviewer) => reviewer.id),
        toDeactivate: [],
        duplicates,
        errors: [...parsed.errors, ...duplicates.map((id) => `Duplicate reviewer id: ${id}`)],
        rawEmailsHashed: parsed.rawEmailsHashed
    };
    await ensureDir(join(cwd, ".vibecli/audit/reviewer-directory"));
    await writeFile(join(cwd, ".vibecli/audit/reviewer-directory/import-preview.json"), `${JSON.stringify(preview, null, 2)}\n`, "utf8");
    return preview;
}
export async function applyReviewerImport(cwd, file, options = {}) {
    if (options.confirm !== "IMPORT REVIEWERS") {
        throw new Error("Reviewer import requires exact confirmation: IMPORT REVIEWERS");
    }
    const preview = await previewReviewerImport(cwd, file, {
        allowRawEmail: options.allowRawEmail,
        confirm: options.rawEmailConfirm
    });
    if (preview.errors.length)
        throw new Error(`Reviewer import has validation errors: ${preview.errors.join("; ")}`);
    const path = join(cwd, configPath);
    const configText = await import("node:fs/promises").then((fs) => fs.readFile(path, "utf8"));
    const raw = parse(configText);
    const organization = (raw.organization ?? {});
    organization.reviewers = preview.reviewers
        .filter((reviewer) => reviewer.active)
        .map((reviewer) => ({
        id: reviewer.id,
        display_name: reviewer.displayName,
        roles: reviewer.roles
    }));
    raw.organization = organization;
    await writeFile(path, stringify(raw), "utf8");
    await appendOrgAuditEvent(cwd, {
        eventType: "audit.reviewers.imported",
        actor: null,
        runId: null,
        summary: `Imported ${preview.reviewers.length} reviewer directory entries.`,
        artifactHashes: [],
        redacted: true
    }).catch(() => undefined);
    return preview;
}
//# sourceMappingURL=reviewer-import.js.map