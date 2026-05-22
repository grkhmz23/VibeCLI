import { join, resolve } from "node:path";
import { loadConfig } from "../config/config.js";
export async function loadProvenanceConfig(cwd) {
    return (await loadConfig(cwd)).provenance;
}
export async function provenanceKeyPaths(cwd) {
    const config = await loadProvenanceConfig(cwd);
    const keyDir = resolve(cwd, config.signing.key_dir);
    return {
        keyDir,
        privateKeyPath: join(keyDir, config.signing.private_key_file),
        publicKeyPath: join(keyDir, config.signing.public_key_file),
        metadataPath: join(keyDir, "key-metadata.json")
    };
}
//# sourceMappingURL=config.js.map