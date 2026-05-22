import { sha256Text } from "../ledger/hash.js";

export function localPayloadSignature(payload: unknown): {
  algorithm: "sha256-local";
  payloadHash: string;
} {
  return {
    algorithm: "sha256-local",
    payloadHash: sha256Text(JSON.stringify(payload, null, 2))
  };
}
