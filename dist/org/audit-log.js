import { appendFile, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { orgPaths } from "./config.js";
import { redactOrgText } from "./validation.js";
import { sha256Text } from "./signature.js";
import { ensureDir, pathExists, readJson } from "../utils/fs.js";
export async function appendOrgAuditEvent(cwd, event) {
    const paths = await orgPaths(cwd);
    await ensureDir(paths.auditLogDir);
    const createdAt = new Date().toISOString();
    const fullEvent = {
        version: 1,
        createdAt,
        eventType: redactOrgText(event.eventType).slice(0, 120),
        actor: event.actor ? redactOrgText(event.actor).slice(0, 120) : null,
        runId: event.runId,
        summary: redactOrgText(event.summary).slice(0, 500),
        artifactHashes: event.artifactHashes,
        redacted: true
    };
    const logPath = join(paths.auditLogDir, "audit-log.jsonl");
    const chainPath = join(paths.auditLogDir, "audit-chain.json");
    const existing = pathExists(chainPath)
        ? await readJson(chainPath).catch(() => [])
        : [];
    const eventHash = sha256Text(JSON.stringify(fullEvent));
    const previousChainHash = existing.at(-1)?.chainHash ?? null;
    const entry = {
        index: existing.length,
        createdAt,
        eventHash,
        previousChainHash,
        chainHash: sha256Text(JSON.stringify({ index: existing.length, eventHash, previousChainHash }))
    };
    await appendFile(logPath, `${JSON.stringify(fullEvent)}\n`, "utf8");
    await writeFile(chainPath, `${JSON.stringify([...existing, entry], null, 2)}\n`, "utf8");
    return entry;
}
export async function readOrgAudit(cwd) {
    const paths = await orgPaths(cwd);
    const logPath = join(paths.auditLogDir, "audit-log.jsonl");
    const events = pathExists(logPath)
        ? (await readFile(logPath, "utf8"))
            .split(/\r?\n/)
            .filter(Boolean)
            .map((line) => JSON.parse(line))
        : [];
    const chain = pathExists(join(paths.auditLogDir, "audit-chain.json"))
        ? await readJson(join(paths.auditLogDir, "audit-chain.json")).catch(() => [])
        : [];
    return { events, chain };
}
export async function verifyOrgAuditLog(cwd) {
    const { events, chain } = await readOrgAudit(cwd);
    const errors = [];
    if (events.length !== chain.length)
        errors.push("Audit event count does not match chain length.");
    for (let index = 0; index < Math.min(events.length, chain.length); index += 1) {
        const eventHash = sha256Text(JSON.stringify(events[index]));
        const previousChainHash = index === 0 ? null : chain[index - 1]?.chainHash;
        const expectedChainHash = sha256Text(JSON.stringify({ index, eventHash, previousChainHash }));
        const entry = chain[index];
        if (entry.index !== index)
            errors.push(`Audit chain index ${index} is incorrect.`);
        if (entry.eventHash !== eventHash)
            errors.push(`Audit event ${index} hash mismatch.`);
        if (entry.previousChainHash !== previousChainHash)
            errors.push(`Audit chain ${index} previous hash mismatch.`);
        if (entry.chainHash !== expectedChainHash)
            errors.push(`Audit chain ${index} hash mismatch.`);
    }
    return {
        ok: errors.length === 0,
        eventCount: events.length,
        latestChainHash: chain.at(-1)?.chainHash ?? null,
        errors
    };
}
//# sourceMappingURL=audit-log.js.map