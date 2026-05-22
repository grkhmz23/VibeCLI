export declare function sha256File(path: string): Promise<{
    sha256: string;
    sizeBytes: number;
}>;
export declare function sha256Text(value: string): string;
