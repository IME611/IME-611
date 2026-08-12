import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { loadCorpus } from '../../../shared/corpus.js';
import { fragmentText } from '../ingestion/deterministic-fragmenter.js';
import { PostgresClaimEvidenceRepository } from '../../infrastructure/postgres/claim-evidence.repository.js';
import { createEvidenceBackedClaim } from '../../domain/claim/claim-evidence.service.js';
import { PostgresCoreLoopRepository } from '../../../synthesis/infrastructure/postgres/core-loop.repository.js';
import { getInsightProvenanceTrace } from '../../../synthesis/infrastructure/postgres/provenance-trace.js';
import { createInsightFromClaims, createExperiment, reflectOnExperiment } from '../../../synthesis/domain/core-loop/core-loop.service.js';

const MIGRATIONS = [
  'database/migrations/001_knowledge_foundation.sql',
  'database/migrations/002_legacy_source_backfill.sql',
];
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');

function fullChapterText(chapter) {
  if (Array.isArray(chapter?.paragraphs) && chapter.paragraphs.length) return chapter.paragraphs.join('\n\n');
  for (const key of ['fullText','rawText','text','content','body']) {
    if (typeof chapter?.[key] === 'string' && chapter[key].trim()) return chapter[key];
  }
  throw new Error(`Chapter ${chapter?.number ?? '?'} has no canonical text payload.`);
}

async function migrate(db) {
  await db.query(`CREATE TABLE IF NOT EXISTS schema_migrations(name TEXT PRIMARY KEY,checksum CHAR(64) NOT NULL,applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await db.query("SELECT pg_advisory_lock(hashtext('eil_live_migrations'))");
  try {
    for (const relative of MIGRATIONS) {
      const sql = await fs.readFile(path.join(process.cwd(), relative), 'utf8');
      const checksum = sha256(sql);
      const prior = await db.query('SELECT checksum FROM schema_migrations WHERE name=$1',[relative]);
      if (prior.rows[0]) {
        if (prior.rows[0].checksum !== checksum) throw new Error(`Migration drift detected for ${relative}`);
        continue;
      }
      await db.query(sql);
      await db.query('INSERT INTO schema_migrations(name,checksum) VALUES($1,$2)',[relative,checksum]);
    }
  } finally {
    await db.query("SELECT pg_advisory_unlock(hashtext('eil_live_migrations'))");
  }
}

async function seedCorpus(db) {
  const chapters = loadCorpus();
  if (chapters.length !== 18) throw new Error(`Expected 18 canonical chapters, found ${chapters.length}`);
  let createdSources = 0;
  let createdFragments = 0;

  for (const chapter of chapters) {
    const raw = fullChapterText(chapter);
    const contentHash = sha256(Buffer.from(raw,'utf8'));
    let source = (await db.query('SELECT id FROM sources WHERE content_hash=$1',[contentHash])).rows[0];
    if (!source) {
      source = (await db.query(`INSERT INTO sources(type,title,author,mime_type,raw_content,content_hash,metadata)
        VALUES('DOCUMENT',$1,'','application/vnd.openxmlformats-officedocument.wordprocessingml.document',$2,$3,$4)
        RETURNING id`,[
          chapter.title || `פרק ${chapter.number}`,
          raw,
          contentHash,
          { ingestion:'repository-corpus-bootstrap-v1', chapterNumber:chapter.number, sourceFile:chapter.sourceFile || null, canonicalTextPreserved:true }
        ])).rows[0];
      createdSources += 1;
    }

    const fragments = fragmentText(raw,{sourceContentHash:contentHash});
    for (const fragment of fragments) {
      const result = await db.query(`INSERT INTO source_fragments(source_id,fragmenter_version,ordinal,fragment_key,content_hash,raw_text,start_offset,end_offset,metadata)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (source_id,fragmenter_version,ordinal) DO NOTHING`,[
          source.id,fragment.fragmenterVersion,fragment.ordinal,fragment.fragmentKey,fragment.contentHash,
          fragment.rawText,fragment.startOffset,fragment.endOffset,{chapterNumber:chapter.number,sourceFile:chapter.sourceFile || null}
        ]);
      createdFragments += result.rowCount || 0;
    }
  }
  return { chapters:18, createdSources, createdFragments };
}

async function verifyGoldenThread(db) {
  const seed = await db.query(`SELECT s.id source_id,s.title,f.id fragment_id,f.raw_text,f.ordinal
    FROM sources s JOIN source_fragments f ON f.source_id=s.id
    WHERE length(trim(f.raw_text)) > 80 ORDER BY s.created_at,f.ordinal LIMIT 1`);
  const row = seed.rows[0];
  if (!row) throw new Error('No canonical SourceFragment available after bootstrap.');
  const quote = String(row.raw_text).replace(/\s+/g,' ').trim().slice(0,220);
  const claimRepo = new PostgresClaimEvidenceRepository(db);
  const claimResult = await createEvidenceBackedClaim({repository:claimRepo,input:{
    statement:quote,type:'FACTUAL',fragmentId:row.fragment_id,quote,evidenceRelation:'SUPPORTS',evidenceStrength:1,
    extractionMethod:'golden-thread-v1',modelVersion:null,metadata:{verification:true,sourceTitle:row.title}
  }});
  const coreRepo = new PostgresCoreLoopRepository(db,getInsightProvenanceTrace);
  const insight = await createInsightFromClaims({repository:coreRepo,
    statement:`Golden Thread verified insight from source: ${row.title}`,
    claimIds:[claimResult.claim.id],modelConfidence:null,metadata:{verification:true}});
  if (insight.status !== 'SUPPORTED') throw new Error(`Expected SUPPORTED insight, got ${insight.status}`);
  const experiment = await createExperiment({repository:coreRepo,insightId:insight.id,
    hypothesis:'A provenance-backed insight can be translated into a testable action.',
    action:'Record one observation that tests the insight.',expectedSignal:'A concrete observation is captured and linked back to the insight.'});
  const reflection = await reflectOnExperiment({repository:coreRepo,experimentId:experiment.id,
    observation:'Golden Thread database verification completed.',outcome:'PASS',
    interpretation:'The full core loop persisted successfully with traceability to canonical source text.'});
  const trace = await getInsightProvenanceTrace(db,insight.id);
  if (!trace.length || !trace.every(x=>x.source_id&&x.fragment_id&&x.claim_id&&x.evidence_id)) throw new Error('Golden Thread provenance trace is incomplete.');
  if (!trace.some(x=>String(x.fragment_text).replace(/\s+/g,' ').includes(quote))) throw new Error('Exact evidence quote was not found in canonical fragment.');
  return {pass:true,sourceId:row.source_id,fragmentId:row.fragment_id,claimId:claimResult.claim.id,insightId:insight.id,insightStatus:insight.status,experimentId:experiment.id,reflectionId:reflection.reflection.id,traceRows:trace.length,quote};
}

export async function bootstrapLiveDatabase(db) {
  await migrate(db);
  const seeded = await seedCorpus(db);
  const counts = (await db.query(`SELECT (SELECT COUNT(*)::int FROM sources) sources,(SELECT COUNT(*)::int FROM source_fragments) fragments`)).rows[0];
  if (counts.sources < 18 || counts.fragments < 18) throw new Error(`Bootstrap integrity failed: ${counts.sources} sources / ${counts.fragments} fragments`);
  const golden = await verifyGoldenThread(db);
  return {ok:true,stage:'FOUNDATION_LIVE_DB',seeded,counts,golden};
}
