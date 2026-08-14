import crypto from 'node:crypto';
import { getDb } from '../../server/shared/postgres.js';
import { extractAtomicCandidates } from '../../server/knowledge/application/extraction/atomic-extraction-preview.service.js';

const METHOD='deterministic-rules';
const VERSION='atomic-he-v0.2';
const sha256=value=>crypto.createHash('sha256').update(String(value)).digest('hex');

function summarize(candidates){
  const byType={},byClaimType={};let excluded=0,evidenceFailures=0;
  for(const candidate of candidates){
    byType[candidate.type]=(byType[candidate.type]||0)+1;
    if(candidate.claimType)byClaimType[candidate.claimType]=(byClaimType[candidate.claimType]||0)+1;
    if(candidate.excludeFromKnowledge)excluded+=1;
    evidenceFailures+=candidate.evidence.filter(edge=>!edge.exactQuoteVerified).length;
  }
  return{total:candidates.length,byType,byClaimType,excluded,evidenceFailures};
}

async function main(){
  const pool=getDb(),client=await pool.connect();let runId=null;
  try{
    const sources=(await client.query(`
      SELECT id,title,raw_content,content_hash,metadata
      FROM sources
      WHERE metadata->>'ingestion'='repository-corpus-bootstrap-v1'
      ORDER BY (metadata->>'chapterNumber')::int NULLS LAST,created_at
    `)).rows;
    if(sources.length!==18)throw new Error(`Expected 18 verified seed sources, found ${sources.length}`);

    const fingerprint=sha256(sources.map(source=>`${source.id}:${source.content_hash}`).join('|'));
    const existing=(await client.query(`
      SELECT id,stats FROM extraction_runs
      WHERE scope='CORPUS' AND extraction_method=$1 AND extractor_version=$2 AND status='COMPLETED'
        AND stats->>'corpusFingerprint'=$3
      ORDER BY completed_at DESC LIMIT 1
    `,[METHOD,VERSION,fingerprint])).rows[0];
    if(existing){console.log(`SKIP atomic extraction ${VERSION}: corpus fingerprint already completed in run ${existing.id}`);return}

    runId=(await client.query(`
      INSERT INTO extraction_runs(scope,extraction_method,extractor_version,status,stats)
      VALUES('CORPUS',$1,$2,'RUNNING',$3::jsonb) RETURNING id
    `,[METHOD,VERSION,JSON.stringify({corpusFingerprint:fingerprint,sourceCount:sources.length})])).rows[0].id;

    await client.query('BEGIN');
    const all=[];
    for(const source of sources){
      const fragments=(await client.query(`
        SELECT id,ordinal,raw_text,start_offset,end_offset,content_hash,fragmenter_version
        FROM source_fragments WHERE source_id=$1 ORDER BY ordinal
      `,[source.id])).rows;
      const candidates=extractAtomicCandidates(source,fragments);
      all.push(...candidates);
      for(const candidate of candidates){
        if(!candidate.evidence.length||candidate.evidence.some(edge=>!edge.exactQuoteVerified)){
          throw new Error(`Unverified evidence for candidate ${candidate.candidateKey}`);
        }
        const metadata={signals:candidate.signals,section:candidate.section,defines:candidate.defines};
        const row=(await client.query(`
          INSERT INTO extraction_candidates(
            run_id,source_id,candidate_key,atom_type,claim_type,candidate_text,exact_quote,
            source_start,source_end,confidence,review_status,exclude_from_knowledge,
            extraction_method,extractor_version,metadata
          ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'PENDING',$11,$12,$13,$14::jsonb)
          ON CONFLICT(candidate_key,extractor_version) DO UPDATE SET
            run_id=EXCLUDED.run_id,
            updated_at=NOW()
          RETURNING id
        `,[runId,candidate.sourceId,candidate.candidateKey,candidate.type,candidate.claimType,candidate.text,candidate.exactQuote,candidate.sourceStart,candidate.sourceEnd,candidate.confidence,candidate.excludeFromKnowledge,METHOD,VERSION,JSON.stringify(metadata)])).rows[0];

        for(const edge of candidate.evidence){
          await client.query(`
            INSERT INTO extraction_candidate_evidence(
              candidate_id,fragment_id,source_start,source_end,fragment_start,fragment_end,exact_quote,exact_quote_verified
            ) VALUES($1,$2,$3,$4,$5,$6,$7,$8)
            ON CONFLICT(candidate_id,fragment_id,source_start,source_end) DO UPDATE SET
              fragment_start=EXCLUDED.fragment_start,
              fragment_end=EXCLUDED.fragment_end,
              exact_quote=EXCLUDED.exact_quote,
              exact_quote_verified=EXCLUDED.exact_quote_verified
          `,[row.id,edge.fragmentId,edge.sourceStart,edge.sourceEnd,edge.fragmentStart,edge.fragmentEnd,edge.quote,edge.exactQuoteVerified]);
        }
      }
    }
    const summary=summarize(all);
    if(summary.evidenceFailures!==0)throw new Error(`Extraction generated ${summary.evidenceFailures} evidence failures`);
    await client.query('COMMIT');
    await client.query(`
      UPDATE extraction_runs SET status='COMPLETED',completed_at=NOW(),stats=$2::jsonb WHERE id=$1
    `,[runId,JSON.stringify({corpusFingerprint:fingerprint,sourceCount:sources.length,...summary})]);
    console.log(`OK atomic extraction ${VERSION}: ${summary.total} PENDING candidates across ${sources.length} sources; excluded=${summary.excluded}; evidenceFailures=0`);
  }catch(error){
    try{await client.query('ROLLBACK')}catch{}
    if(runId){try{await client.query(`UPDATE extraction_runs SET status='FAILED',completed_at=NOW(),error=$2 WHERE id=$1`,[runId,String(error?.stack||error).slice(0,10000)])}catch{}}
    throw error;
  }finally{
    client.release();
    await pool.end();
  }
}

main().catch(error=>{console.error(error);process.exit(1)});
