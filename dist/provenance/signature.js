import { createHash, sign, verify } from "node:crypto";
export function sha256Text(value) {
    return createHash("sha256").update(value).digest("hex");
}
export function fingerprintPublicKey(publicKeyPem) {
    return sha256Text(publicKeyPem).slice(0, 32);
}
function sortValue(value) {
    if (Array.isArray(value))
        return value.map(sortValue);
    if (typeof value === "object" && value !== null) {
        return Object.fromEntries(Object.entries(value)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, sortValue(entry)]));
    }
    return value;
}
export function canonicalJson(value) {
    return JSON.stringify(sortValue(value));
}
export function signCanonicalJson(value, privateKey) {
    return sign(null, Buffer.from(canonicalJson(value), "utf8"), privateKey).toString("base64");
}
export function verifyCanonicalJson(value, signatureBase64, publicKey) {
    return verify(null, Buffer.from(canonicalJson(value), "utf8"), publicKey, Buffer.from(signatureBase64, "base64"));
}
//# sourceMappingURL=signature.js.map