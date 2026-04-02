/** Generates a random UUID v4 string. */
export function generateId(): string {
  return crypto.randomUUID();
}
