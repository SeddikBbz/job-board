// A relationship value is either an ID or a populated document. Returns the ID either way.
export const relationId = (value: unknown): number =>
  value && typeof value === 'object' && 'id' in value
    ? (value as { id: number }).id
    : (value as number)
