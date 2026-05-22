import { loadConfig } from "../config/config.js";
export async function loadRemoteAttestationConfig(cwd) {
    return (await loadConfig(cwd)).remote_attestation;
}
//# sourceMappingURL=config.js.map