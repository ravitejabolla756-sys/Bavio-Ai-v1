/** Normalize documented API envelopes without converting missing data to success. */
export function unwrapData(value: unknown): unknown {
  if (value && typeof value === 'object' && 'data' in value) return value.data;
  return value;
}

export function requireArray<T>(value: unknown): T[] {
  if (!Array.isArray(value)) throw new Error('The server returned an invalid collection. Please retry.');
  return value as T[];
}

export function requireRecord<T>(value: unknown): T {
  if (!value || typeof value !== 'object' || !('id' in value) || !value.id) {
    throw new Error('The server did not confirm a saved record. Refresh before retrying.');
  }
  return value as T;
}
