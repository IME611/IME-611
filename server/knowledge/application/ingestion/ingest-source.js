import crypto from 'crypto';
import { fragmentText } from './deterministic-fragmenter.js';

function sourceType(mimeType, fileName = '') {
  if (mimeType?.startsWith('image/')) return 'IMAGE';
  if (mimeType?.startsWith('video/')) return 'VIDEO';
  if (mimeType?.startsWith('audio/')) return 'AUDIO';
  if (/\.md$/i.test(fileName)) return 'NOTE';
  return 'DOCUMENT';
}

export async function ingestCanonicalSource({ db, repository, input, manageTransaction = true }) {
  const originalBytes = input.originalBytes;
  if (!Buffer.isBuffer(originalBytes) || !originalBytes.length) {
    throw new Error('Canonical ingestion requires the original source bytes.');
  }
  if (typeof input.extractedText !== 'string' || !input.extractedText.trim()) {
    throw new Error('Canonical ingestion requires non-empty extracted text.');
  }

  const contentHash = crypto.createHash('sha256').update(originalBytes).digest('hex');
  const existing = await repository.findByContentHash(contentHash);
  if (existing) {
    const fragments = await repository.getFragments(existing.id);
    return { deduplicated: true, source: existing, fragments };
  }

  const fragments = fragmentText(input.extractedText, { sourceContentHash: contentHash });
  if (manageTransaction) await db.query('BEGIN');
  try {
    const source = await repository.insertSource({
      type: sourceType(input.mimeType, input.fileName),
      title: input.title,
      author: input.author || '',
      originalUri: input.originalUri || null,
      mimeType: input.mimeType || 'application/octet-stream',
      rawContent: input.extractedText,
      contentHash,
      metadata: {
        ingestion: 'lossless-canonical-v1',
        originalFileName: input.fileName || '',
        originalByteSize: originalBytes.length,
        extractedCharacterCount: input.extractedText.length,
      },
    });
    const storedFragments = await repository.insertFragments(source.id, fragments);
    if (manageTransaction) await db.query('COMMIT');
    return { deduplicated: false, source, fragments: storedFragments };
  } catch (error) {
    if (manageTransaction) await db.query('ROLLBACK');
    throw error;
  }
}
