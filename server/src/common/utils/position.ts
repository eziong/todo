import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';

/**
 * Generate a fractional index key between two existing keys.
 * If prev is null, generates a key before next.
 * If next is null, generates a key after prev.
 * If both are null, generates an initial key.
 */
export function generatePositionBetween(
  prev: string | null,
  next: string | null,
): string {
  return generateKeyBetween(prev ?? null, next ?? null);
}

/**
 * Generate a fractional index key after the last position (append to end).
 */
export function generateEndPosition(lastPosition: string | null): string {
  return generateKeyBetween(lastPosition ?? null, null);
}

/**
 * Generate N evenly-spaced fractional index keys (for backfill / bulk creation).
 */
export function generateInitialPositions(count: number): string[] {
  if (count === 0) return [];
  return generateNKeysBetween(null, null, count);
}
