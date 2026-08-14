import crypto from 'node:crypto';
import { loadCorpus } from '../../../shared/corpus.js';

const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const SEED_INGESTION = 'repository-corpus-bootstrap-v1';

function canonicalText(source) {
  if (Array.isArray(source?.paragraphs) && source.paragraphs.length) return source.paragraphs.join('\n\n');
  for (const key of ['fullText','rawText','text','content','body']) {
    if (typeof source?.[key] === 'string' && source[key].trim()) return source[key];
  }
  throw new Error(`Seed source ${source?.number ?? '?'} has no canonical text payload`);
}

function detectLanguage(value) {
  const text = String(value || '');
  const letters = text.match(/\p{L}/gu) || [];
  if (!letters.length) return 'unknown';
  const hebrew = text.match(/[\u0590-\u05ff]/g) || [];
  const ratio = hebrew.length / letters.length;
  if (ratio >= 0.7) return 'he';
  if (ratio >= 0.15) return 'mixed';
  return 'other';
}

function chapterNumberOf(row) {
  const value = Number(row?.metadata?.chapterNumber);
  return Number.isInteger(value) && value > 0 ? value : null;
}

function groupBy(rows, keyFn) {
  const map = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (key == null) continue;
    const list = map.get(key) || [];
    list.push(row);
    map.set(key, list);
  }
  return map;
}

function verifyFragments(expectedText, fragments) {
  const issues = [];
  if (!fragments.length) return { ok:false, issues:['NO_FRAGMENTS'], fragmentCount:0, overlapCharacters:0 };
  let coveredEnd = 0;
  let overlapCharacters = 0;
  for (let index = 0; index < fragments.length; index += 1) {
    const fragment = fragments[index];
    if (Number(fragment.ordinal) !== index) issues.push('NON_SEQUENTIAL_ORDINALS');
    const start = Number(fragment.start_offset);
    const end = Number(fragment.end_offset);
    const raw = String(fragment.raw_text || '');
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || end > expectedText.length) {
      issues.push('INVALID_FRAGMENT_OFFSETS');
      continue;
    }
    if (start > coveredEnd) issues.push('FRAGMENT_COVERAGE_GAP');
    if (start < coveredEnd) overlapCharacters += Math.min(coveredEnd, end) - start;
    if (raw.length !== end - start) issues.push('FRAGMENT_LENGTH_OFFSET_MISMATCH');
    if (raw !== expectedText.slice(start,end)) issues.push('FRAGMENT_TEXT_OFFSET_MISMATCH');
    if (sha256(raw) !== fragment.content_hash) issues.push('FRAGMENT_HASH_MISMATCH');
    coveredEnd = Math.max(coveredEnd,end);
  }
  if (Number(fragments[0]?.start_offset) !== 0 || coveredEnd !== expectedText.length) issues.push('FRAGMENT_COVERAGE_MISMATCH');
  return { ok:issues.length === 0, issues:[...new Set(issues)], fragmentCount:fragments.length, overlapCharacters };
}

async function readLegacyFiles(db) {
  const table = (await db.query("SELECT to_regclass('public.source_documents') AS name")).rows[0]?.name;
  if (!table) return { available:false, byFileName:new Map() };
  const { rows } = await db.query(`
    SELECT id,file_name,mime_type,byte_size,sha256,created_at,
           (COALESCE(original_file_base64,'') <> '') AS has_original_bytes
    FROM source_documents
  `);
  return { available:true, byFileName:groupBy(rows, row => String(row.file_name || '')) };
}

export async function buildCorpusInventory(db) {
  const seed = loadCorpus();
  const expected = seed.map(item => {
    const text = canonicalText(item);
    return {
      number:Number(item.number),
      sourceFile:String(item.sourceFile || ''),
      repoTitle:String(item.title || `פרק ${item.number}`),
      expectedHash:sha256(Buffer.from(text,'utf8')),
      text,
      language:detectLanguage(text),
      paragraphCount:Array.isArray(item.paragraphs) ? item.paragraphs.length : null,
      characterCount:text.length,
    };
  }).sort((a,b) => a.number - b.number);

  const { rows:sources } = await db.query(`
    SELECT id,type,title,author,original_uri,mime_type,raw_content,original_bytes_uri,
           content_hash,metadata,created_at
    FROM sources
    WHERE metadata->>'ingestion'=$1
    ORDER BY (metadata->>'chapterNumber')::int NULLS LAST,created_at
  `,[SEED_INGESTION]);

  const sourceIds = sources.map(row => row.id);
  const fragments = sourceIds.length ? (await db.query(`
    SELECT source_id,ordinal,raw_text,start_offset,end_offset,content_hash,fragmenter_version
    FROM source_fragments
    WHERE source_id = ANY($1::uuid[])
    ORDER BY source_id,ordinal
  `,[sourceIds])).rows : [];

  const fragmentsBySource = groupBy(fragments, row => row.source_id);
  const sourcesByNumber = groupBy(sources, chapterNumberOf);
  const sourcesByHash = groupBy(sources, row => row.content_hash);
  const legacy = await readLegacyFiles(db);
  const inventory = [];

  for (const item of expected) {
    const candidates = sourcesByNumber.get(item.number) || [];
    const row = candidates.find(candidate => candidate.content_hash === item.expectedHash) || candidates[0] || null;
    const issues = [];
    if (!row) {
      inventory.push({
        seedNumber:item.number,sourceId:null,sourceFile:item.sourceFile,title:item.repoTitle,
        type:'DOCUMENT',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        expectedHash:item.expectedHash,storedHash:null,language:item.language,paragraphCount:item.paragraphCount,
        characterCount:item.characterCount,fragmentCount:0,canonicalTextVerified:false,fragmentCoverageVerified:false,
        originalBinaryPreserved:false,legacyOriginalBinaryPreserved:false,createdAt:null,issues:['MISSING_SOURCE'],
      });
      continue;
    }

    if (candidates.length > 1) issues.push('DUPLICATE_CHAPTER_NUMBER');
    if ((sourcesByHash.get(row.content_hash) || []).length > 1) issues.push('DUPLICATE_CONTENT_HASH');
    if (String(row.metadata?.sourceFile || '') !== item.sourceFile) issues.push('SOURCE_FILE_METADATA_MISMATCH');
    const raw = String(row.raw_content || '');
    const rawHash = sha256(Buffer.from(raw,'utf8'));
    if (row.content_hash !== item.expectedHash) issues.push('STORED_HASH_MISMATCH');
    if (rawHash !== item.expectedHash) issues.push('RAW_TEXT_HASH_MISMATCH');
    if (raw !== item.text) issues.push('RAW_TEXT_NOT_EXACT');
    const fragmentAudit = verifyFragments(item.text, fragmentsBySource.get(row.id) || []);
    issues.push(...fragmentAudit.issues);

    const legacyMatches = legacy.byFileName.get(item.sourceFile) || [];
    if (legacyMatches.length > 1) issues.push('MULTIPLE_LEGACY_FILE_MATCHES');
    const legacyRow = legacyMatches[0] || null;
    const originalBinaryPreserved = Boolean(row.original_bytes_uri);
    const legacyOriginalBinaryPreserved = Boolean(legacyRow?.has_original_bytes);
    if (!originalBinaryPreserved && !legacyOriginalBinaryPreserved) issues.push('ORIGINAL_DOCX_BINARY_NOT_VERIFIED');

    inventory.push({
      seedNumber:item.number,
      sourceId:row.id,
      sourceFile:item.sourceFile,
      title:row.title,
      type:row.type,
      mimeType:row.mime_type,
      expectedHash:item.expectedHash,
      storedHash:row.content_hash,
      language:item.language,
      paragraphCount:item.paragraphCount,
      characterCount:item.characterCount,
      fragmentCount:fragmentAudit.fragmentCount,
      fragmentOverlapCharacters:fragmentAudit.overlapCharacters,
      fragmenterVersion:(fragmentsBySource.get(row.id) || [])[0]?.fragmenter_version || null,
      canonicalTextVerified:rawHash === item.expectedHash && raw === item.text,
      fragmentCoverageVerified:fragmentAudit.ok,
      originalBinaryPreserved,
      legacyOriginalBinaryPreserved,
      legacyDocumentId:legacyRow?.id ?? null,
      legacyByteSize:legacyRow?.byte_size ?? null,
      legacyStoredSha256:legacyRow?.sha256 || null,
      createdAt:row.created_at,
      issues:[...new Set(issues)],
    });
  }

  const missing = inventory.filter(row => !row.sourceId).length;
  const duplicateChapterNumbers = [...sourcesByNumber.values()].filter(rows => rows.length > 1).length;
  const duplicateHashes = [...sourcesByHash.values()].filter(rows => rows.length > 1).length;
  const canonicalTextVerified = inventory.filter(row => row.canonicalTextVerified).length;
  const fragmentCoverageVerified = inventory.filter(row => row.fragmentCoverageVerified).length;
  const binaryPreserved = inventory.filter(row => row.originalBinaryPreserved || row.legacyOriginalBinaryPreserved).length;
  const hardFailures = inventory.filter(row => row.issues.some(issue => [
    'MISSING_SOURCE','DUPLICATE_CHAPTER_NUMBER','DUPLICATE_CONTENT_HASH','STORED_HASH_MISMATCH',
    'RAW_TEXT_HASH_MISMATCH','RAW_TEXT_NOT_EXACT','NO_FRAGMENTS','NON_SEQUENTIAL_ORDINALS',
    'FRAGMENT_COVERAGE_GAP','INVALID_FRAGMENT_OFFSETS','FRAGMENT_LENGTH_OFFSET_MISMATCH',
    'FRAGMENT_TEXT_OFFSET_MISMATCH','FRAGMENT_HASH_MISMATCH','FRAGMENT_COVERAGE_MISMATCH',
  ].includes(issue))).length;

  return {
    ok:hardFailures === 0 && sources.length === expected.length,
    generatedAt:new Date().toISOString(),
    seedIngestion:SEED_INGESTION,
    summary:{
      expected:expected.length,
      found:sources.length,
      missing,
      duplicateChapterNumbers,
      duplicateHashes,
      canonicalTextVerified,
      fragmentCoverageVerified,
      binaryPreserved,
      originalBinaryAuditAvailable:legacy.available,
      hardFailures,
    },
    inventory,
    notes:[
      'The seed number is inventory metadata only; it is not a learning-sequence or chapter contract.',
      'content_hash is calculated from canonical extracted UTF-8 text for repository-corpus-bootstrap-v1.',
      'Overlapping source fragments are valid when their offsets and text match the canonical source.',
      'Original DOCX binary preservation is reported separately from canonical text preservation.',
    ],
  };
}
