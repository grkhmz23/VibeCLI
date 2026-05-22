import { sha256Text } from "../provenance/signature.js";
import { RunStore } from "../orchestrator/run-store.js";
import { readRetentionLedger } from "./retention-ledger.js";
import { updateEvidenceLifecycleState } from "./state.js";
export async function verifyRetentionLedger(cwd, runId) {
    const { events, chain } = await readRetentionLedger(cwd);
    const errors = [];
    if (events.length !== chain.length)
        errors.push("Retention ledger event count does not match chain length.");
    for (let index = 0; index < Math.min(events.length, chain.length); index += 1) {
        const event = events[index];
        const entry = chain[index];
        const eventHash = sha256Text(JSON.stringify(event));
        const previousChainHash = index === 0 ? null : chain[index - 1]?.chainHash;
        const chainHash = sha256Text(JSON.stringify({ index, runId: event.runId, eventHash, previousChainHash }));
        if (entry.index !== index)
            errors.push(`Retention chain index ${index} is incorrect.`);
        if (entry.eventHash !== eventHash)
            errors.push(`Retention event ${index} hash mismatch.`);
        if (entry.previousChainHash !== previousChainHash)
            errors.push(`Retention chain ${index} previous hash mismatch.`);
        if (entry.chainHash !== chainHash)
            errors.push(`Retention chain ${index} hash mismatch.`);
    }
    if (runId && !events.some((event) => event.runId === runId)) {
        errors.push(`No retention ledger events found for ${runId}.`);
    }
    const result = {
        ok: errors.length === 0,
        eventCount: runId ? events.filter((event) => event.runId === runId).length : events.length,
        latestChainHash: chain.at(-1)?.chainHash ?? null,
        errors
    };
    if (runId) {
        await updateEvidenceLifecycleState(new RunStore(cwd), runId, (state) => {
            state.retentionLedger = {
                status: result.ok ? "verified" : "invalid",
                latestChainHash: result.latestChainHash ?? undefined
            };
        }).catch(() => undefined);
    }
    return result;
}
//# sourceMappingURL=retention-ledger-verify.js.map