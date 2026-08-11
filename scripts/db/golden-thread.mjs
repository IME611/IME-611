import pg from 'pg';
import { PostgresClaimEvidenceRepository } from '../../server/knowledge/infrastructure/postgres/claim-evidence.repository.js';
import { createEvidenceBackedClaim } from '../../server/knowledge/domain/claim/claim-evidence.service.js';
import { PostgresCoreLoopRepository } from '../../server/synthesis/infrastructure/postgres/core-loop.repository.js';
import { createInsightFromClaims, createExperiment, reflectOnExperiment } from '../../server/synthesis/domain/core-loop/core-loop.service.js';

const { Client } = pg;
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL is required');
const ssl = process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false };
const client = new Client({ connectionString: DATABASE_URL, ssl });

const TRACE_SQL = `
WITH insight_root AS (
  SELECT id, statement, status FROM insights WHERE id=$1::uuid
), direct_claims AS (
  SELECT pe.source_entity_id claim_id
  FROM provenance_edges pe JOIN insight_root i
    ON pe.derived_entity_type='INSIGHT' AND pe.derived_entity_id=i.id
  WHERE pe.source_entity_type='CLAIM'
)
SELECT i.id insight_id,i.statement insight_statement,i.status::text insight_status,
       c.id claim_id,c.statement claim_statement,e.id evidence_id,e.relation::text evidence_relation,
       f.id fragment_id,f.ordinal fragment_ordinal,f.raw_text fragment_text,
       s.id source_id,s.title source_title,s.content_hash source_content_hash
FROM insight_root i
JOIN direct_claims dc ON TRUE
JOIN claims c ON c.id=dc.claim_id
JOIN evidence e ON e.claim_id=c.id
JOIN source_fragments f ON f.id=e.fragment_id
JOIN sources s ON s.id=f.source_id
ORDER BY f.ordinal,e.id`;

const getTrace = async (db,id)=>(await db.query(TRACE_SQL,[id])).rows;

async function main(){
  await client.connect();
  try{
    const seed = await client.query(`
      SELECT s.id source_id,s.title,f.id fragment_id,f.raw_text,f.ordinal
      FROM sources s JOIN source_fragments f ON f.source_id=s.id
      WHERE length(trim(f.raw_text)) > 80
      ORDER BY s.created_at,f.ordinal LIMIT 1`);
    const row=seed.rows[0];
    if(!row) throw new Error('No canonical source fragment found. Run migrations/backfill first.');

    const quote=String(row.raw_text).replace(/\s+/g,' ').trim().slice(0,220);
    const claimRepo=new PostgresClaimEvidenceRepository(client);
    const claimResult=await createEvidenceBackedClaim({repository:claimRepo,input:{
      statement:quote,
      type:'FACTUAL',
      fragmentId:row.fragment_id,
      quote,
      evidenceRelation:'SUPPORTS',
      evidenceStrength:1,
      extractionMethod:'golden-thread-v1',
      modelVersion:null,
      metadata:{verification:true,sourceTitle:row.title}
    }});

    const coreRepo=new PostgresCoreLoopRepository(client,getTrace);
    const insight=await createInsightFromClaims({repository:coreRepo,
      statement:`Golden Thread verified insight from source: ${row.title}`,
      claimIds:[claimResult.claim.id],modelConfidence:null,metadata:{verification:true}});
    if(insight.status!=='SUPPORTED') throw new Error(`Expected SUPPORTED insight, got ${insight.status}`);

    const experiment=await createExperiment({repository:coreRepo,insightId:insight.id,
      hypothesis:'A provenance-backed insight can be translated into a testable action.',
      action:'Record one observation that tests the insight.',
      expectedSignal:'A concrete observation is captured and linked back to the insight.'});
    const reflection=await reflectOnExperiment({repository:coreRepo,experimentId:experiment.id,
      observation:'Golden Thread database verification completed.',
      outcome:'PASS',
      interpretation:'The full core loop persisted successfully with traceability to canonical source text.'});

    const trace=await getTrace(client,insight.id);
    if(!trace.length) throw new Error('Provenance trace returned no rows.');
    if(!trace.every(x=>x.source_id&&x.fragment_id&&x.claim_id&&x.evidence_id)) throw new Error('Trace is incomplete.');
    if(!trace.some(x=>String(x.fragment_text).replace(/\s+/g,' ').includes(quote))) throw new Error('Exact evidence quote was not found in traced canonical fragment.');

    console.log(JSON.stringify({ok:true,source:{id:row.source_id,title:row.title},fragment:{id:row.fragment_id,ordinal:row.ordinal,quote},claimId:claimResult.claim.id,insightId:insight.id,insightStatus:insight.status,experimentId:experiment.id,reflectionId:reflection.reflection.id,traceRows:trace.length,trace:trace.map(x=>({sourceTitle:x.source_title,fragmentId:x.fragment_id,claimId:x.claim_id,evidenceId:x.evidence_id,fragmentPreview:String(x.fragment_text).slice(0,280)}))},null,2));
  } finally { await client.end(); }
}
main().catch(e=>{console.error(e);process.exit(1)});
