export declare function localPayloadSignature(payload: unknown): {
    algorithm: "sha256-local";
    payloadHash: string;
};
