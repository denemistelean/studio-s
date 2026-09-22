export function safeErrorName(error: unknown): string {
  if (!(error instanceof Error) || error.name.length === 0) {
    return 'UnknownError';
  }

  return error.name;
}
