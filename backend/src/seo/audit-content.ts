import { createHash } from 'crypto';

/**
 * Text fingerprints for comparing pages.
 *
 * Pages are compared as sets of overlapping 5-word phrases (shingles). Two
 * pages that share a template share most of their phrases even when the city
 * name differs, which is what makes this a fair test for near-copies.
 */

export const SHINGLE_SIZE = 5;

/** Lowercased word tokens in any script, so Hindi pages compare too. */
export function contentTokens(text: string): string[] {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

/** 32-bit FNV-1a. Collisions are negligible at a few hundred pages. */
export function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function shingles(tokens: string[], size = SHINGLE_SIZE): Set<number> {
  const out = new Set<number>();
  if (tokens.length === 0) return out;
  if (tokens.length < size) {
    out.add(fnv1a(tokens.join(' ')));
    return out;
  }
  for (let i = 0; i + size <= tokens.length; i++) {
    out.add(fnv1a(tokens.slice(i, i + size).join(' ')));
  }
  return out;
}

/**
 * Stable hash of the words on a page. Markup, whitespace and case changes do
 * not move it; a changed sentence does. Used to spot a new "updated" date on
 * a page whose content did not change.
 */
export function contentHash(tokens: string[]): string {
  return createHash('sha256').update(tokens.join(' ')).digest('hex').slice(0, 20);
}
