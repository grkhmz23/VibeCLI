export class VibeError extends Error {
  constructor(
    message: string,
    public readonly exitCode = 1
  ) {
    super(message);
    this.name = "VibeError";
  }
}

export function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
