import { loadConfig, saveConfig } from "../config/config.js";
import { validateRemoteTarget, validateTargetName } from "./validation.js";
export async function listRemoteTargets(cwd) {
    const config = await loadConfig(cwd);
    return Object.entries(config.remote_attestation.targets).map(([name, target]) => summarizeTarget(name, target));
}
export async function doctorRemoteTargets(cwd, options = {}) {
    if (options.ping && options.confirm !== "PING REMOTE TARGETS") {
        throw new Error("Remote target ping requires exact confirmation: PING REMOTE TARGETS");
    }
    const config = await loadConfig(cwd);
    const results = [];
    for (const [name, target] of Object.entries(config.remote_attestation.targets)) {
        const summary = summarizeTarget(name, target);
        const errors = validateRemoteTarget(name, target, config.remote_attestation);
        const warnings = [];
        const envPresent = target.token_env ? Boolean(process.env[target.token_env]) : null;
        if (target.token_env && !envPresent)
            warnings.push(`Token env ${target.token_env} is not set.`);
        let pingStatus = null;
        if (options.ping && errors.length === 0) {
            const response = await fetch(target.url, {
                method: "HEAD",
                headers: redactedHeaders(target),
                signal: AbortSignal.timeout(config.remote_attestation.request_timeout_ms)
            }).catch(() => undefined);
            pingStatus = response?.status ?? null;
            if (!response)
                warnings.push("Ping failed.");
        }
        results.push({
            ...summary,
            ok: errors.length === 0,
            envPresent,
            pingStatus,
            warnings,
            errors
        });
    }
    return results;
}
export async function addRemoteTarget(cwd, args) {
    validateTargetName(args.name);
    if (args.confirm !== `ADD REMOTE TARGET ${args.name}`) {
        throw new Error(`Remote target add requires exact confirmation: ADD REMOTE TARGET ${args.name}`);
    }
    const config = await loadConfig(cwd);
    if (config.remote_attestation.targets[args.name] && !args.replace) {
        throw new Error(`Remote target ${args.name} already exists; use --replace with exact confirmation.`);
    }
    const target = {
        type: "generic-http",
        url: args.url,
        token_env: args.tokenEnv,
        enabled: true,
        headers: args.headers ?? { "X-Source": "vibecli" }
    };
    const errors = validateRemoteTarget(args.name, target, config.remote_attestation);
    if (errors.length)
        throw new Error(errors.join("; "));
    config.remote_attestation.targets[args.name] = target;
    await saveConfig(cwd, config);
    return summarizeTarget(args.name, target);
}
export async function disableRemoteTarget(cwd, name, confirm) {
    if (confirm !== `DISABLE REMOTE TARGET ${name}`) {
        throw new Error(`Remote target disable requires exact confirmation: DISABLE REMOTE TARGET ${name}`);
    }
    const config = await loadConfig(cwd);
    const target = config.remote_attestation.targets[name];
    if (!target)
        throw new Error(`Remote target ${name} does not exist.`);
    target.enabled = false;
    await saveConfig(cwd, config);
    return summarizeTarget(name, target);
}
export async function removeRemoteTarget(cwd, name, confirm) {
    if (confirm !== `REMOVE REMOTE TARGET ${name}`) {
        throw new Error(`Remote target removal requires exact confirmation: REMOVE REMOTE TARGET ${name}`);
    }
    const config = await loadConfig(cwd);
    if (!config.remote_attestation.targets[name])
        throw new Error(`Remote target ${name} does not exist.`);
    delete config.remote_attestation.targets[name];
    await saveConfig(cwd, config);
    return { name, removed: true };
}
function summarizeTarget(name, target) {
    return {
        name,
        type: target.type,
        host: new URL(target.url).host,
        enabled: target.enabled,
        tokenEnv: target.token_env ?? null
    };
}
function redactedHeaders(target) {
    return Object.fromEntries(Object.entries(target.headers ?? {}).filter(([name]) => !/^authorization$/i.test(name)));
}
//# sourceMappingURL=targets.js.map