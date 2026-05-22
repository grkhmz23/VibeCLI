import { loadConfig } from "../config/config.js";
export async function loadReleaseConfig(cwd) {
    return (await loadConfig(cwd)).release;
}
export function resolveReleaseChannel(config, channel) {
    const selected = channel ?? config.default_channel;
    if (!config.allowed_channels.includes(selected)) {
        throw new Error(`Release channel ${selected} is not allowed`);
    }
    return selected;
}
//# sourceMappingURL=config.js.map