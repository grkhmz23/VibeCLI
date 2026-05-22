import { isIP } from "node:net";
const targetNamePattern = /^[a-z0-9][a-z0-9_-]*$/;
const envPattern = /^[A-Z_][A-Z0-9_]*$/;
const secretLike = /(sk-[A-Za-z0-9_-]{12,}|[A-Za-z0-9_=-]{32,})/;
const blockedSchemes = new Set(["file:", "ftp:", "ssh:", "gopher:", "data:", "javascript:"]);
export function validateTargetName(name) {
    if (!targetNamePattern.test(name)) {
        throw new Error(`Remote target name is unsafe: ${name}`);
    }
}
export function validateRemoteTarget(name, target, config) {
    validateTargetName(name);
    const errors = [];
    if (target.type !== "generic-http")
        errors.push("remote attestation target type must be generic-http in Phase 11");
    let parsed;
    try {
        parsed = new URL(target.url);
    }
    catch {
        errors.push(`remote attestation target ${name} URL is invalid`);
    }
    if (parsed) {
        if (blockedSchemes.has(parsed.protocol) || !["http:", "https:"].includes(parsed.protocol)) {
            errors.push(`remote attestation target ${name} uses unsupported URL scheme`);
        }
        const localhost = isLocalhost(parsed.hostname);
        if (config.require_https_targets && parsed.protocol !== "https:") {
            if (!(config.allow_localhost_targets && localhost && parsed.protocol === "http:")) {
                errors.push(`remote attestation target ${name} must use HTTPS`);
            }
        }
        if (isPrivateNetworkHost(parsed.hostname) && !(config.allow_localhost_targets && localhost)) {
            errors.push(`remote attestation target ${name} points at a private-network host`);
        }
    }
    if (target.token_env) {
        if (!envPattern.test(target.token_env))
            errors.push(`remote attestation target ${name} token_env must be an env var name`);
        if (secretLike.test(target.token_env))
            errors.push(`remote attestation target ${name} token_env looks like a raw token`);
    }
    for (const [header, value] of Object.entries(target.headers ?? {})) {
        if (!/^[A-Za-z0-9-]+$/.test(header))
            errors.push(`remote attestation target ${name} header ${header} is unsafe`);
        if (secretLike.test(value))
            errors.push(`remote attestation target ${name} header ${header} looks like a secret`);
    }
    return errors;
}
export function validateRemoteAttestationConfig(config) {
    const errors = [];
    if (config.max_payload_bytes <= 0 || config.max_payload_bytes > 10_000_000) {
        errors.push("remote_attestation.max_payload_bytes must be positive and bounded");
    }
    if (!config.send_metadata_only) {
        errors.push("remote_attestation.send_metadata_only must remain true by default in Phase 11");
    }
    if (config.include_evidence_archive_by_default) {
        errors.push("remote_attestation.include_evidence_archive_by_default must remain false in Phase 11");
    }
    for (const [name, target] of Object.entries(config.targets)) {
        errors.push(...validateRemoteTarget(name, target, config));
    }
    return errors;
}
export function isLocalhost(hostname) {
    return (hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "::1" ||
        hostname === "[::1]");
}
function isPrivateNetworkHost(hostname) {
    const host = hostname.replace(/^\[|\]$/g, "");
    if (isLocalhost(host))
        return true;
    if (isIP(host) === 4) {
        const [a, b] = host.split(".").map(Number);
        return (a === 10 ||
            a === 127 ||
            (a === 172 && b >= 16 && b <= 31) ||
            (a === 192 && b === 168) ||
            (a === 169 && b === 254));
    }
    if (isIP(host) === 6) {
        return (host === "::1" ||
            host.toLowerCase().startsWith("fc") ||
            host.toLowerCase().startsWith("fd") ||
            host.toLowerCase().startsWith("fe80"));
    }
    return false;
}
//# sourceMappingURL=validation.js.map