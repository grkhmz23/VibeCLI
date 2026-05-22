import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import YAML from "yaml";
import { redactReleaseText } from "../release/redaction.js";
const safeToken = /^[a-z0-9][a-z0-9_-]*$/;
export async function readReviewerDirectoryFile(cwd, file, options = {}) {
    if (isAbsolute(file) || file.includes(".."))
        throw new Error("Reviewer directory path must be a relative path inside the repository.");
    const fullPath = resolve(cwd, file);
    if (!fullPath.startsWith(resolve(cwd)))
        throw new Error("Reviewer directory path must be inside the repository.");
    const text = await readFile(fullPath, "utf8");
    const parsed = file.endsWith(".csv")
        ? parseCsv(text)
        : file.endsWith(".json")
            ? JSON.parse(text)
            : YAML.parse(text);
    const reviewers = [];
    const errors = [];
    let rawEmailsHashed = false;
    for (const [index, raw] of parsed.entries()) {
        const entry = raw;
        const id = stringValue(entry.id);
        const displayName = redactReleaseText(stringValue(entry.displayName ?? entry.display_name), 120);
        const roles = Array.isArray(entry.roles)
            ? entry.roles.map(String)
            : stringValue(entry.roles)
                .split(/[|;]/)
                .map((role) => role.trim())
                .filter(Boolean);
        const active = typeof entry.active === "boolean"
            ? entry.active
            : stringValue(entry.active || "true").toLowerCase() !== "false";
        if (!safeToken.test(id))
            errors.push(`Reviewer ${index} has unsafe id.`);
        if (!displayName || displayName.length > 120)
            errors.push(`Reviewer ${id || index} has invalid display name.`);
        for (const role of roles) {
            if (!safeToken.test(role))
                errors.push(`Reviewer ${id || index} has unsafe role ${role}.`);
        }
        let emailHash = typeof entry.emailHash === "string" ? entry.emailHash : undefined;
        if (typeof entry.email === "string" && entry.email) {
            if (options.allowRawEmail && options.confirm !== "IMPORT RAW REVIEWER EMAILS") {
                throw new Error("Raw reviewer email import requires exact confirmation: IMPORT RAW REVIEWER EMAILS");
            }
            emailHash = createHash("sha256").update(entry.email).digest("hex");
            rawEmailsHashed = true;
        }
        reviewers.push({ id, displayName, emailHash, roles, active });
    }
    return { reviewers, errors, rawEmailsHashed };
}
function parseCsv(text) {
    const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
    const headers = headerLine.split(",").map((value) => value.trim());
    return lines.map((line) => {
        const values = line.split(",").map((value) => value.trim());
        return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    });
}
function stringValue(value) {
    return typeof value === "string" || typeof value === "number" || typeof value === "boolean"
        ? String(value)
        : "";
}
//# sourceMappingURL=reviewer-directory.js.map