import crypto from'node:crypto';
import{getDb}from'../../server/shared/postgres.js';
import{previewExplicitRelations}from'../../server/knowledge/application/relations/explicit-relation.service.js';

const METHOD='explicit-linguistic-patterns';
const VERSION='relations-he-v0.2';
const sha256=value=>crypto.createHash('sha256').update(String(value)).digest('hex');

function summarize(relations){
 const byType={},byResolution={};let mapped=0,partial=0,unresolved=0;
 for(const relation of relations){
  byType[relation.relationType]=(byType[relation.relationType]||0)+1;
  byResolution[relation.endpointResolution]=(byResolution[relation.endpointResolution]||0)+1;
  if(relation.endpointResolution==='MAPPED')mapped+=1;
  else if(relation.endpointResolution==='PARTIAL')partial+=1;
  else unresolved+=1;
 }
 return{total:relations.length,byType,byResolution,mapped,partial,unresolved};
}

async function main(){
 const pool=getDb(),client=await pool.connect();let runId=null;
 try{
  const extractionFingerprint=(await client.query(`
   SELECT stats->>'corpusFingerprint' AS fingerprint
   FROM extraction_runs
   WHERE scope='CORPUS' AND status='COMPLETED'
   ORDER BY completed_at DESC LIMIT 1
  `)).rows[0]?.fingerprint;
  if(!extractionFingerprint)throw new Error('Completed corpus extraction fingerprint is required');
  const fingerprint=sha256(`${extractionFingerprint}|${VERSION}`);
  const existing=(await client.query(`
   SELECT r.id,
          (SELECT COUNT(*)::int FROM relation_candidates c WHERE c.run_id=r.id) AS candidate_count
   FROM relation_extraction_runs r
   WHERE r.scope='CORPUS' AND r.extraction_method=$1 AND r.extractor_version=$2 AND r.status='COMPLETED'
     AND r.stats->>'relationFingerprint'=$3
   ORDER BY r.completed_at DESC LIMIT 1
  `,[METHOD,VERSION,fingerprint])).rows[0];
  if(existing&&Number(existing.candidate_count)>0){console.log(`SKIP relation extraction ${VERSION}: fingerprint already completed in run ${existing.id} with ${existing.candidate_count} candidates`);return}
  if(existing){console.warn(`RECOVER relation extraction ${VERSION}: completed run ${existing.id} has no candidate rows; rebuilding safely`)}

  runId=(await client.query(`
   INSERT INTO relation_extraction_runs(scope,extraction_method,extractor_version,status,stats)
   VALUES('CORPUS',$1,$2,'RUNNING',$3::jsonb) RETURNING id
  `,[METHOD,VERSION,JSON.stringify({relationFingerprint:fingerprint,extractionFingerprint,recoveryOfEmptyRun:existing?.id||null})])).rows[0].id;

  const preview=await previewExplicitRelations(client,{limit:1000}),relations=preview.relations;
  if(!relations.length)throw new Error('Relation extractor produced zero review candidates');
  await client.query('BEGIN');
  for(const relation of relations){
   const atom=(await client.query(`
    SELECT c.candidate_text,
           COUNT(e.id)::int AS evidence_count,
           COUNT(e.id) FILTER(WHERE NOT e.exact_quote_verified)::int AS unverified_count
    FROM extraction_candidates c
    LEFT JOIN extraction_candidate_evidence e ON e.candidate_id=c.id
    WHERE c.id=$1
    GROUP BY c.id
   `,[relation.sourceAtomId])).rows[0];
   if(!atom)throw new Error(`Missing source atom ${relation.sourceAtomId}`);
   if(atom.candidate_text!==relation.exactQuote)throw new Error(`Relation quote mismatch for atom ${relation.sourceAtomId}`);
   if(Number(atom.evidence_count)<1||Number(atom.unverified_count)!==0)throw new Error(`Unverified source evidence for relation ${relation.relationKey}`);
   const metadata={sourceFile:relation.sourceFile,section:relation.section,fromMatchMode:relation.from.matchMode,toMatchMode:relation.to.matchMode,unresolvedEndpointCount:relation.unresolvedEndpointCount};
   await client.query(`
    INSERT INTO relation_candidates(
      run_id,relation_key,relation_type,source_atom_id,source_id,
      from_node_key,from_kind,from_label,from_resolution,
      to_node_key,to_kind,to_label,to_resolution,endpoint_resolution,
      evidence_mode,cue,exact_quote,confidence,review_status,extractor_version,metadata
    ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'EXPLICIT_LINGUISTIC',$15,$16,$17,'PENDING',$18,$19::jsonb)
    ON CONFLICT(relation_key,extractor_version) DO UPDATE SET run_id=EXCLUDED.run_id,updated_at=NOW()
   `,[runId,relation.relationKey,relation.relationType,relation.sourceAtomId,relation.sourceId,
       relation.from.nodeId,relation.from.kind,relation.from.label,relation.from.resolutionStatus,
       relation.to.nodeId,relation.to.kind,relation.to.label,relation.to.resolutionStatus,relation.endpointResolution,
       relation.cue,relation.exactQuote,relation.confidence,VERSION,JSON.stringify(metadata)]);
  }
  await client.query('COMMIT');
  const summary=summarize(relations);
  await client.query(`UPDATE relation_extraction_runs SET status='COMPLETED',completed_at=NOW(),stats=$2::jsonb WHERE id=$1`,[runId,JSON.stringify({relationFingerprint:fingerprint,extractionFingerprint,...summary})]);
  console.log(`OK relation extraction ${VERSION}: ${summary.total} PENDING candidates; mapped=${summary.mapped}; partial=${summary.partial}; unresolved=${summary.unresolved}`);
 }catch(error){
  try{await client.query('ROLLBACK')}catch{}
  if(runId){try{await client.query(`UPDATE relation_extraction_runs SET status='FAILED',completed_at=NOW(),error=$2 WHERE id=$1`,[runId,String(error?.stack||error).slice(0,10000)])}catch{}}
  throw error;
 }finally{client.release();await pool.end()}
}

main().catch(error=>{console.error(error);process.exit(1)});
