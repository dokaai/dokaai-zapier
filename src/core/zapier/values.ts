export const shouldIncludeInputValue = (value: unknown): boolean =>
  value !== undefined && value !== null && value !== '';

export const compactInputEntries = (
  entries: Iterable<[string, unknown]>,
): Record<string, unknown> =>
  Object.fromEntries(
    Array.from(entries).filter(([, value]) => shouldIncludeInputValue(value)),
  );

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
