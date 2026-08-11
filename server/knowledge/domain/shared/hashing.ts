import { createHash } from 'node:crypto';
import type { Sha256 } from './entity.types';

const UTF8 = 'utf8';

export function sha256(value: string | Buffer): Sha256 {
  return createHash('sha256').update(value).digest('hex');
}

export function normalizeStatement(value: string): string {
  return value
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('und');
}

export function normalizedStatementHash(value: string): Sha256 {
  return sha256(normalizeStatement(value));
}

export function sourceContentHash(original: string | Buffer): Sha256 {
  return sha256(original);
}

export interface FragmentKeyInput {
  sourceContentHash: Sha256;
  fragmenterVersion: string;
  ordinal: number;
  startOffset: number | null;
  endOffset: number | null;
  rawText: string;
}

/**
 * Stable across retries for the same source + fragmenter version.
 * Any change to fragment boundaries, text, ordering, or fragmenter version
 * intentionally creates a different identity.
 */
export function createFragmentKey(input: FragmentKeyInput): Sha256 {
  const payload = [
    'eil.fragment.v1',
    input.sourceContentHash,
    input.fragmenterVersion,
    String(input.ordinal),
    input.startOffset == null ? '' : String(input.startOffset),
    input.endOffset == null ? '' : String(input.endOffset),
    input.rawText,
  ].join('\u001f');

  return sha256(Buffer.from(payload, UTF8));
}

export function fragmentContentHash(rawText: string): Sha256 {
  return sha256(Buffer.from(rawText, UTF8));
}

export function assertSha256(value: string, label = 'hash'): asserts value is Sha256 {
  if (!/^[0-9a-f]{64}$/.test(value)) {
    throw new Error(`${label} must be a lowercase SHA-256 hex digest`);
  }
}
