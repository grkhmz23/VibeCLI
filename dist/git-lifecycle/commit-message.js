import { join } from "node:path";
import { loadConfig } from "../config/config.js";
import { readJson } from "../utils/fs.js";
import { redactHandoffText } from "../handoff/redaction.js";
import { RunStore } from "../orchestrator/run-store.js";
function subjectFromPrompt(prompt, style) {
    const text = prompt.toLowerCase().includes("test")
        ? "test"
        : prompt.toLowerCase().includes("doc")
            ? "docs"
            : "feat";
    const summary = prompt
        .replace(/[^a-zA-Z0-9 ]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    const subject = style === "conventional" ? `${text}: ${summary}` : summary;
    return subject.slice(0, 72);
}
export async function generateCommitMessage(cwd, runId, styleOverride) {
    const config = await loadConfig(cwd);
    const store = new RunStore(cwd);
    const state = await store.readState(runId);
    const apply = await readJson(join(store.runPath(runId), "apply-result.json")).catch(() => undefined);
    const style = styleOverride ?? config.git_lifecycle.commit_style;
    const filesChanged = apply?.filesChanged ?? state.apply.filesChanged;
    const scannerStatus = state.scanners
        ? `${state.scanners.builtinStatus}/${state.scanners.externalStatus}`
        : null;
    const verificationText = !state.verification || state.verification.status === "not_started"
        ? "not run"
        : state.verification.status;
    const scannerText = !scannerStatus || scannerStatus === "not_started/not_started" ? "not run" : scannerStatus;
    const warnings = [
        ...(state.verification?.status === "passed" ? [] : ["Verification: not run."]),
        ...(state.scanners?.builtinStatus !== "not_started" ? [] : ["Scanners: not run."]),
        ...(state.apply.status === "applied" ? [] : ["Source changes: not applied."])
    ];
    const subject = redactHandoffText(subjectFromPrompt(state.prompt, style));
    const body = redactHandoffText([
        `Run: ${runId}`,
        `Policy: ${state.policy ?? "none"}`,
        `Verification: ${verificationText}.`,
        `Scanners: ${scannerText}.`,
        `Source changes: ${state.apply.status === "applied" ? "applied" : "not applied"}.`,
        `Files changed: ${filesChanged.join(", ") || "none recorded"}.`
    ].join("\n\n"));
    const result = {
        runId,
        createdAt: new Date().toISOString(),
        style,
        subject,
        body,
        filesChanged,
        verificationStatus: state.verification?.status ?? null,
        scannerStatus,
        policy: state.policy ?? null,
        warnings
    };
    await store.writeArtifact(runId, "git/commit-message.json", result);
    await store.writeTextArtifact(runId, "git/COMMIT_MESSAGE.md", `${subject}\n\n${body}\n`);
    return result;
}
//# sourceMappingURL=commit-message.js.map