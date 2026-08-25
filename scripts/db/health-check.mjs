import pg from 'pg';
import { normalizeDatabaseUrl } from '../../server/shared/postgres.js';
const { Client } = pg;
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL is required');
const ssl = process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false };
const client = new Client({ connectionString: normalizeDatabaseUrl(DATABASE_URL), ssl });

const requiredTables = [
  'sources','source_fragments','claims','concepts','evidence','connections',
  'insights','experiments','reflections','provenance_edges',
  'legacy_source_mappings','legacy_fragment_mappings','schema_migrations',
  'extraction_runs','extraction_candidates','extraction_candidate_evidence',
  'relation_extraction_runs','relation_candidates','intake_submissions','review_decisions',
  'source_publications','published_learning_cards'
];
const requiredEnums = [
  'source_type','claim_type','claim_status','evidence_relation','insight_status','experiment_status',
  'knowledge_atom_type','extraction_review_status','extraction_run_status',
  'knowledge_relation_type','relation_evidence_mode','relation_endpoint_kind','intake_review_status'
];

async function main(){
  await client.connect();
  try{
    const tables = await client.query(`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename = ANY($1::text[])`,[requiredTables]);
    const enums = await client.query(`SELECT typname FROM pg_type WHERE typtype='e' AND typname = ANY($1::text[])`,[requiredEnums]);
    const missingTables = requiredTables.filter(x=>!tables.rows.some(r=>r.tablename===x));
    const missingEnums = requiredEnums.filter(x=>!enums.rows.some(r=>r.typname===x));
    if(missingTables.length||missingEnums.length){
      throw new Error(`Foundation health check failed. Missing tables=${missingTables.join(',')||'none'} enums=${missingEnums.join(',')||'none'}`);
    }

    const counts = await client.query(`SELECT
      (SELECT COUNT(*)::int FROM sources) canonical_sources,
      (SELECT COUNT(*)::int FROM source_fragments) canonical_fragments,
      (SELECT COUNT(*)::int FROM legacy_source_mappings) mapped_sources,
      (SELECT COUNT(*)::int FROM legacy_fragment_mappings) mapped_fragments,
      (SELECT COUNT(*)::int FROM extraction_runs) extraction_runs,
      (SELECT COUNT(*)::int FROM extraction_candidates) extraction_candidates,
      (SELECT COUNT(*)::int FROM extraction_candidate_evidence) extraction_candidate_evidence,
      (SELECT COUNT(*)::int FROM relation_candidates) relation_candidates,
      (SELECT COUNT(*)::int FROM intake_submissions) intake_submissions,
      (SELECT COUNT(*)::int FROM review_decisions) review_decisions,
      (SELECT COUNT(*)::int FROM source_publications) source_publications,
      (SELECT COUNT(*)::int FROM published_learning_cards WHERE status='PUBLISHED') published_learning_cards,
      (SELECT COUNT(*)::int FROM schema_migrations) migrations_applied`);
    console.log(JSON.stringify({ok:true,...counts.rows[0]},null,2));
  } finally { await client.end(); }
}
main().catch(e=>{console.error(e);process.exit(1)});
