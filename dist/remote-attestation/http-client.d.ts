export type HttpPostResult = {
    statusCode: number;
    body: string;
};
export declare function postJson(url: string, payload: unknown, headers: Record<string, string>, timeoutMs: number): Promise<HttpPostResult>;
export declare function getText(url: string, headers: Record<string, string>, timeoutMs: number): Promise<HttpPostResult>;
