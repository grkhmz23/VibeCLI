import { redactReleaseJson, redactReleaseText } from "../release/redaction.js";
export function redactAttestationText(value) {
    return redactReleaseText(value);
}
export function redactAttestationJson(value) {
    return redactReleaseJson(value);
}
//# sourceMappingURL=redaction.js.map