import pg from 'pg';
import mammoth from 'mammoth';
import { ingestCanonicalSource } from '../../server/knowledge/application/ingestion/ingest-source.js';
import { PostgresSourceIngestionRepository } from '../../server/knowledge/infrastructure/postgres/source-ingestion.repository.js';

const { Pool } = pg;
let pool;
function db() {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
    max: 5,
  });
  return pool;
}

async function extract(fileName, mimeType, bytes, suppliedText) {
  if (typeof suppliedText === 'string' && suppliedText.trim()) return suppliedText;
  if (/\.docx$/i.test(fileName) || mimeType.includes('wordprocessingml')) {
    const result = await mammoth.extractRawText({ buffer: bytes });
    return result.value;
  }
  if (/\.(txt|md|csv|json|html?)$/i.test(fileName) || mimeType.startsWith('text/')) {
    return bytes.toString('utf8');
  }
  throw new Error('Unsupported source type for canonical text extraction.');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method not allowed' });
  const client = db();
  if (!client) return res.status(503).json({ ok: false, error: 'DATABASE_URL is not configured' });

  try {
    const body = req.body || {};
    const fileName = String(body.fileName || body.sourceFilename || 'document.txt');
    const mimeType = String(body.mimeType || 'text/plain');
    const fileBase64 = String(body.fileBase64 || '');
    const originalBytes = fileBase64
      ? Buffer.from(fileBase64, 'base64')
      : Buffer.from(String(body.text || ''), 'utf8');
    const extractedText = await extract(fileName, mimeType, originalBytes, body.text);
    const repository = new PostgresSourceIngestionRepository(client);
    const result = await ingestCanonicalSource({
      db: client,
      repository,
      input: {
        originalBytes,
        extractedText,
        fileName,
        mimeType,
        title: String(body.title || fileName.replace(/\.[^.]+$/, '')),
        author: String(body.author || ''),
        originalUri: body.sourceUrl ? String(body.sourceUrl) : null,
      },
    });

    return res.status(result.deduplicated ? 200 : 201).json({
      ok: true,
      canonical: true,
      deduplicated: result.deduplicated,
      source: result.source,
      fragmentCount: result.fragments.length,
      preservedCharacters: extractedText.length,
    });
  } catch (error) {
    console.error(error);
    const message = error?.message || 'canonical import failed';
    if (/relation .* does not exist/i.test(message) || /type .* does not exist/i.test(message)) {
      return res.status(503).json({ ok: false, error: 'Knowledge migration 001 has not been applied yet.' });
    }
    return res.status(400).json({ ok: false, error: message });
  }
}
