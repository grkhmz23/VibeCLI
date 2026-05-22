export type HttpPostResult = {
  statusCode: number;
  body: string;
};

export async function postJson(
  url: string,
  payload: unknown,
  headers: Record<string, string>,
  timeoutMs: number
): Promise<HttpPostResult> {
  const body = JSON.stringify(payload);
  let attempt = 0;
  let delayMs = 200;
  for (;;) {
    const response = await fetch(url, {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body,
      signal: AbortSignal.timeout(timeoutMs)
    });
    const responseBody = (await response.text()).slice(0, 16_384);
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt >= 1) {
      return { statusCode: response.status, body: responseBody };
    }
    attempt += 1;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    delayMs *= 2;
  }
}

export async function getText(
  url: string,
  headers: Record<string, string>,
  timeoutMs: number
): Promise<HttpPostResult> {
  let attempt = 0;
  let delayMs = 200;
  for (;;) {
    const response = await fetch(url, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(timeoutMs)
    });
    const body = (await response.text()).slice(0, 16_384);
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt >= 1) {
      return { statusCode: response.status, body };
    }
    attempt += 1;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    delayMs *= 2;
  }
}
