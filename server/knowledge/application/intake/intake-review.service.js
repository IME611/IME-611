import crypto from'node:crypto';
import{ingestCanonicalSource}from'../ingestion/ingest-source.js';
import{extractAtomicCandidates}from'../extraction/atomic-extraction-preview.service.js';
import{PostgresSourceIngestionRepository}from'../../infrastructure/postgres/source-ingestion.repository.js';
import{ensureSourcePublicationDraft}from'../publication/source-publication.service.js';

const METHOD='deterministic-rules';
const VERSION='atomic-he-v0.2';
const sha256=value=>crypto.createHash('sha256').update(value).digest('hex');
const LIST_COLUMNS=`id,input_kind,title,source_url,file_name,mime_type,extracted_text_sha256,analysis,review_status,decision_overrides,reviewed_at,reviewed_by,review_note,approved_source_id,created_at,updated_at`;

export async function intakeSchemaReady(db){return Boolean((await db.query(`SELECT to_regclass('public.intake_submissions') AS table_name`)).rows[0]?.table_name)}
export async function stageIntakeSubmission(db,payload,analysis){
 if(!await intakeSchemaReady(db))return{persisted:false,id:null,reason:'INTAKE_SCHEMA_NOT_READY'};
 const bytes=Buffer.isBuffer(payload.originalBytes)?payload.originalBytes:Buffer.from(payload.text,'utf8'),textHash=sha256(Buffer.from(payload.text,'utf8')),bytesHash=sha256(bytes);
 const row=(await db.query(`
  INSERT INTO intake_submissions(input_kind,title,source_url,file_name,mime_type,extracted_text,original_bytes,original_bytes_sha256,extracted_text_sha256,analysis)
  VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)
  RETURNING id,review_status,created_at
 `,[payload.kind,payload.title||'',payload.sourceUrl||null,payload.fileName||null,payload.mimeType||null,payload.text,bytes,bytesHash,textHash,JSON.stringify(analysis)])).rows[0];
 return{persisted:true,id:row.id,status:row.review_status,createdAt:row.created_at};
}
function analysisSummary(analysis){return analysis?{verdict:analysis.verdict||null,suggestedDrawer:analysis.placement?.suggestedDrawer||null,atomic:analysis.atomic?{totalExtracted:analysis.atomic.totalExtracted,analyzed:analysis.atomic.analyzed,byType:analysis.atomic.byType,byVerdict:analysis.atomic.byVerdict}:null}:null}
function submissionView(row,{includeText=false,includeAnalysis=true}={}){return{id:row.id,inputKind:row.input_kind,title:row.title,sourceUrl:row.source_url,fileName:row.file_name,mimeType:row.mime_type,textSha256:row.extracted_text_sha256,analysisSummary:analysisSummary(row.analysis),...(includeAnalysis?{analysis:row.analysis}:{}),reviewStatus:row.review_status,decisionOverrides:row.decision_overrides,reviewedAt:row.reviewed_at,reviewedBy:row.reviewed_by,reviewNote:row.review_note,approvedSourceId:row.approved_source_id,createdAt:row.created_at,updatedAt:row.updated_at,...(includeText?{extractedText:row.extracted_text}:{})}}
export async function getIntakeSubmission(db,id,{includeText=false}={}){
 if(!await intakeSchemaReady(db))return null;const row=(await db.query(`SELECT * FROM intake_submissions WHERE id=$1`,[id])).rows[0];return row?submissionView(row,{includeText,includeAnalysis:true}):null;
}
export async function listIntakeSubmissions(db,{status='PENDING',limit=50}={}){
 if(!await intakeSchemaReady(db))return{schemaReady:false,items:[]};const safeLimit=Math.max(1,Math.min(200,Number(limit)||50)),allowed=new Set(['PENDING','APPROVED','REJECTED','ALL']),normalized=String(status||'PENDING').toUpperCase(),filter=allowed.has(normalized)?normalized:'PENDING';
 const rows=filter==='ALL'?(await db.query(`SELECT ${LIST_COLUMNS} FROM intake_submissions ORDER BY created_at DESC LIMIT $1`,[safeLimit])).rows:(await db.query(`SELECT ${LIST_COLUMNS} FROM intake_submissions WHERE review_status=$1 ORDER BY created_at DESC LIMIT $2`,[filter,safeLimit])).rows;
 return{schemaReady:true,items:rows.map(row=>submissionView(row,{includeAnalysis:false}))};
}
export async function changeIntakeSubmission(db,id,{reviewedBy,overrides={},note=''}){
 if(!reviewedBy)throw Object.assign(new Error('reviewedBy is required for CHANGE'),{status:400,code:'REVIEWER_REQUIRED'});
 const row=(await db.query(`UPDATE intake_submissions SET decision_overrides=COALESCE(decision_overrides,'{}'::jsonb)||$2::jsonb,review_note=$3,updated_at=NOW() WHERE id=$1 AND review_status='PENDING' RETURNING *`,[id,JSON.stringify(overrides||{}),String(note||'').slice(0,10_000)])).rows[0];
 if(!row)throw Object.assign(new Error('pending intake submission not found'),{status:404,code:'INTAKE_NOT_FOUND'});return submissionView(row,{includeText:true});
}
export async function rejectIntakeSubmission(db,id,{reviewedBy,note=''}){
 if(!reviewedBy)throw Object.assign(new Error('reviewedBy is required for REJECT'),{status:400,code:'REVIEWER_REQUIRED'});
 const row=(await db.query(`UPDATE intake_submissions SET review_status='REJECTED',reviewed_at=NOW(),reviewed_by=$2,review_note=$3,updated_at=NOW() WHERE id=$1 AND review_status='PENDING' RETURNING *`,[id,reviewedBy,String(note||'').slice(0,10_000)])).rows[0];
 if(!row)throw Object.assign(new Error('pending intake submission not found'),{status:404,code:'INTAKE_NOT_FOUND'});return submissionView(row);
}
function summarize(candidates){const byType={};let excluded=0;for(const candidate of candidates){byType[candidate.type]=(byType[candidate.type]||0)+1;if(candidate.excludeFromKnowledge)excluded+=1}return{total:candidates.length,byType,excluded}}
async function persistSourceExtraction(client,sourceId){
 const existingCandidates=Number((await client.query(`SELECT COUNT(*)::int AS count FROM extraction_candidates WHERE source_id=$1`,[sourceId])).rows[0]?.count||0);
 if(existingCandidates>0)return{skipped:true,reason:'EXISTING_SOURCE_EXTRACTION',existingCandidates};
 const prior=(await client.query(`SELECT id,stats FROM extraction_runs WHERE scope='SOURCE' AND source_id=$1 AND extraction_method=$2 AND extractor_version=$3 AND status='COMPLETED' ORDER BY completed_at DESC LIMIT 1`,[sourceId,METHOD,VERSION])).rows[0];
 if(prior)return{skipped:true,reason:'COMPLETED_SOURCE_RUN',runId:prior.id,summary:prior.stats};
 const source=(await client.query(`SELECT id,title,raw_content,content_hash,metadata FROM sources WHERE id=$1`,[sourceId])).rows[0];if(!source)throw new Error(`approved source ${sourceId} not found`);
 const fragments=(await client.query(`SELECT id,ordinal,raw_text,start_offset,end_offset,content_hash,fragmenter_version FROM source_fragments WHERE source_id=$1 ORDER BY ordinal`,[sourceId])).rows,candidates=extractAtomicCandidates(source,fragments),runId=(await client.query(`INSERT INTO extraction_runs(source_id,scope,extraction_method,extractor_version,status,stats) VALUES($1,'SOURCE',$2,$3,'RUNNING','{}'::jsonb) RETURNING id`,[sourceId,METHOD,VERSION])).rows[0].id;
 for(const candidate of candidates){
  if(!candidate.evidence.length||candidate.evidence.some(edge=>!edge.exactQuoteVerified))throw new Error(`Unverified evidence for approved intake candidate ${candidate.candidateKey}`);
  const metadata={signals:candidate.signals,section:candidate.section,defines:candidate.defines,intakeApprovedSource:true};
  const inserted=(await client.query(`
   INSERT INTO extraction_candidates(run_id,source_id,candidate_key,atom_type,claim_type,candidate_text,exact_quote,source_start,source_end,confidence,review_status,exclude_from_knowledge,extraction_method,extractor_version,metadata)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'PENDING',$11,$12,$13,$14::jsonb)
   ON CONFLICT(candidate_key,extractor_version) DO NOTHING RETURNING id
  `,[runId,candidate.sourceId,candidate.candidateKey,candidate.type,candidate.claimType,candidate.text,candidate.exactQuote,candidate.sourceStart,candidate.sourceEnd,candidate.confidence,candidate.excludeFromKnowledge,METHOD,VERSION,JSON.stringify(metadata)])).rows[0];
  if(!inserted)continue;
  for(const edge of candidate.evidence)await client.query(`INSERT INTO extraction_candidate_evidence(candidate_id,fragment_id,source_start,source_end,fragment_start,fragment_end,exact_quote,exact_quote_verified) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(candidate_id,fragment_id,source_start,source_end) DO NOTHING`,[inserted.id,edge.fragmentId,edge.sourceStart,edge.sourceEnd,edge.fragmentStart,edge.fragmentEnd,edge.quote,edge.exactQuoteVerified]);
 }
 const summary=summarize(candidates);await client.query(`UPDATE extraction_runs SET status='COMPLETED',completed_at=NOW(),stats=$2::jsonb WHERE id=$1`,[runId,JSON.stringify(summary)]);return{skipped:false,runId,summary};
}
export async function approveIntakeSubmission(db,id,{reviewedBy,note=''}){
 if(!reviewedBy)throw Object.assign(new Error('reviewedBy is required for APPROVE'),{status:400,code:'REVIEWER_REQUIRED'});
 const client=await db.connect();
 try{
  await client.query('BEGIN');
  const row=(await client.query(`SELECT * FROM intake_submissions WHERE id=$1 FOR UPDATE`,[id])).rows[0];if(!row)throw Object.assign(new Error('intake submission not found'),{status:404,code:'INTAKE_NOT_FOUND'});if(row.review_status!=='PENDING')throw Object.assign(new Error(`intake submission is already ${row.review_status}`),{status:409,code:'INTAKE_ALREADY_REVIEWED'});
  const overrides=row.decision_overrides||{},bytes=Buffer.isBuffer(row.original_bytes)&&row.original_bytes.length?row.original_bytes:Buffer.from(row.extracted_text,'utf8'),repository=new PostgresSourceIngestionRepository(client);
  const ingestion=await ingestCanonicalSource({db:client,repository,manageTransaction:false,input:{originalBytes:bytes,extractedText:row.extracted_text,fileName:row.file_name||`${row.input_kind.toLowerCase()}.txt`,mimeType:row.mime_type||'text/plain',title:String(overrides.title||row.title||'Intake source').slice(0,500),author:String(overrides.author||''),originalUri:row.source_url||null}}),extraction=await persistSourceExtraction(client,ingestion.source.id);
  const updated=(await client.query(`UPDATE intake_submissions SET review_status='APPROVED',reviewed_at=NOW(),reviewed_by=$2,review_note=$3,approved_source_id=$4,updated_at=NOW() WHERE id=$1 RETURNING *`,[id,reviewedBy,String(note||'').slice(0,10_000),ingestion.source.id])).rows[0];
  const publication=ingestion.deduplicated?{schemaReady:await publicationSchemaReadySafe(client),created:false,publication:null,reason:'DUPLICATE_SOURCE'}:await ensureSourcePublicationDraft(client,{sourceId:ingestion.source.id,intakeSubmissionId:id});
  await client.query('COMMIT');
  return{submission:submissionView(updated),ingestion:{deduplicated:ingestion.deduplicated,source:ingestion.source,fragmentCount:ingestion.fragments.length},extraction,publication,mapEffect:{repositoryEligibleImmediately:true,learnerVisible:false,note:'The approved source is preserved in the repository and its extracted units enter review. Learner cards require a separate creator-approved publication.'}};
 }catch(error){try{await client.query('ROLLBACK')}catch{};throw error}finally{client.release()}
}

async function publicationSchemaReadySafe(db){
 try{return Boolean((await db.query(`SELECT to_regclass('public.source_publications') AS table_name`)).rows[0]?.table_name)}catch{return false}
}
