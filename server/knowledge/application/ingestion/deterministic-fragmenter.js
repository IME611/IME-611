import crypto from 'crypto';

export const FRAGMENTER_VERSION = 'text-v1:2400:250:newline';

export function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function fragmentText(text, { size = 2400, overlap = 250, sourceContentHash } = {}) {
  if (typeof text !== 'string' || !text.length) return [];
  if (!/^[0-9a-f]{64}$/.test(String(sourceContentHash || ''))) {
    throw new Error('fragmentText requires a canonical sourceContentHash');
  }

  const fragments = [];
  let start = 0;
  let ordinal = 0;

  while (start < text.length) {
    let end = Math.min(text.length, start + size);
    if (end < text.length) {
      const newline = text.lastIndexOf('\n', end);
      if (newline > start + size * 0.6) end = newline;
    }

    const rawText = text.slice(start, end);
    const contentHash = sha256(rawText);
    const fragmentKey = sha256([
      'eil.fragment.v1',
      sourceContentHash,
      FRAGMENTER_VERSION,
      ordinal,
      start,
      end,
      rawText,
    ].join('\u001f'));

    fragments.push({
      ordinal,
      rawText,
      startOffset: start,
      endOffset: end,
      contentHash,
      fragmentKey,
      fragmenterVersion: FRAGMENTER_VERSION,
    });

    ordinal += 1;
    if (end === text.length) break;
    start = Math.max(end - overlap, start + 1);
  }

  return fragments;
}
