export function validateProvenanceConfig(config) {
    const errors = [];
    if (config.format !== "slsa-inspired")
        errors.push("provenance.format must be slsa-inspired");
    if (config.signing.algorithm !== "ed25519")
        errors.push("signing.algorithm must be ed25519");
    if (config.signing.key_dir !== ".vibecli/keys" &&
        !config.signing.key_dir.startsWith(".vibecli/keys/")) {
        errors.push("signing.key_dir must be inside .vibecli/keys");
    }
    if (!config.signing.private_key_file.endsWith(".private.pem")) {
        errors.push("private_key_file must end in .private.pem");
    }
    if (!config.signing.public_key_file.endsWith(".public.pem")) {
        errors.push("public_key_file must end in .public.pem");
    }
    if (config.github_release.publish_releases)
        errors.push("publish_releases must remain false");
    if (config.github_release.upload_assets)
        errors.push("upload_assets must remain false");
    return { ok: errors.length === 0, errors };
}
//# sourceMappingURL=validation.js.map