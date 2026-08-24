import{getDb}from'../server/shared/postgres.js';
import{buildCorpusInventory}from'../server/knowledge/application/corpus/corpus-inventory.service.js';
import{previewAtomicExtraction,previewCorpusExtraction}from'../server/knowledge/application/extraction/atomic-extraction-preview.service.js';
import{matchAgainstCorpus,buildConceptRegistryPreview}from'../server/knowledge/application/matching/knowledge-overlap.service.js';
import{getPublishedLearningCards,getSourcePublicationHealth,publicationSchemaReady}from'../server/knowledge/application/publication/source-publication.service.js';
import{withHardening,text,requestUrl}from'./_lib/hardening.js';
import{requireEditor}from'./_lib/editor-auth.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const param=(req,name)=>requestUrl(req).searchParams.get(name);
const positiveId=value=>{if(value===null)return null;const id=Number(value);return Number.isInteger(id)&&id>0?id:NaN};
const ownerId=req=>{const value=String(req.headers?.['x-eil-owner-id']||'').trim();return UUID.test(value)?value:null};
const WRITE_RESOURCES=new Set(['items','inbox','crystals','taxonomy']);
const isProtectedWrite=(resource,method)=>method!=='GET'&&WRITE_RESOURCES.has(resource);

async function handleItems(req,res,db){
 const rawId=param(req,'id'),id=positiveId(rawId),hasId=Number.isInteger(id);
 if(rawId!==null&&!hasId)return res.status(400).json({ok:false,error:'id must be a positive integer'});
 if(req.method==='GET'){
  if(hasId){const{rows}=await db.query('SELECT * FROM knowledge_items WHERE id=$1',[id]);return rows[0]?res.status(200).json({ok:true,item:rows[0]}):res.status(404).json({ok:false,error:'item not found'})}
  const q=text(param(req,'q'),{max:240});
  const{rows}=q?await db.query(`SELECT * FROM knowledge_items WHERE title ILIKE $1 OR content ILIKE $1 OR source ILIKE $1 OR EXISTS(SELECT 1 FROM unnest(tags) t WHERE t ILIKE $1) ORDER BY updated_at DESC`,[`%${q}%`]):await db.query('SELECT * FROM knowledge_items ORDER BY updated_at DESC');
  return res.status(200).json({ok:true,items:rows});
 }
 const body=req.body||{};
 if(req.method==='POST'){
  const title=text(body.title,{max:500});if(!title)return res.status(400).json({ok:false,error:'title is required'});
  const{rows}=await db.query('INSERT INTO knowledge_items(title,kind,content,tags,source) VALUES($1,$2,$3,$4,$5) RETURNING *',[title,text(body.kind||'ידע',{max:120}),text(body.content,{max:200_000,trim:false}),Array.isArray(body.tags)?body.tags.slice(0,50).map(tag=>text(tag,{max:100})):[],text(body.source,{max:2_000})]);
  return res.status(201).json({ok:true,item:rows[0]});
 }
 if(req.method==='PUT'){
  if(!hasId)return res.status(400).json({ok:false,error:'id is required'});const title=text(body.title,{max:500});if(!title)return res.status(400).json({ok:false,error:'title is required'});
  const{rows}=await db.query('UPDATE knowledge_items SET title=$1,kind=$2,content=$3,tags=$4,source=$5,updated_at=NOW() WHERE id=$6 RETURNING *',[title,text(body.kind||'ידע',{max:120}),text(body.content,{max:200_000,trim:false}),Array.isArray(body.tags)?body.tags.slice(0,50).map(tag=>text(tag,{max:100})):[],text(body.source,{max:2_000}),id]);
  return rows[0]?res.status(200).json({ok:true,item:rows[0]}):res.status(404).json({ok:false,error:'item not found'});
 }
 if(req.method==='DELETE'){if(!hasId)return res.status(400).json({ok:false,error:'id is required'});await db.query('DELETE FROM knowledge_items WHERE id=$1',[id]);return res.status(204).end()}
 res.setHeader('Allow','GET,POST,PUT,DELETE');return res.status(405).json({ok:false,error:'method not allowed'});
}

async function handleInbox(req,res,db){
 if(req.method==='GET'){const{rows}=await db.query(`SELECT * FROM inbox_items WHERE status='new' ORDER BY created_at DESC`);return res.status(200).json({ok:true,items:rows})}
 if(req.method==='POST'){const body=req.body||{},title=text(body.title,{max:500});if(!title)return res.status(400).json({ok:false,error:'title is required'});const{rows}=await db.query('INSERT INTO inbox_items(title,content,source) VALUES($1,$2,$3) RETURNING *',[title,text(body.content,{max:200_000,trim:false}),text(body.source,{max:2_000})]);return res.status(201).json({ok:true,item:rows[0]})}
 res.setHeader('Allow','GET,POST');return res.status(405).json({ok:false,error:'method not allowed'});
}

async function handleSources(req,res,db){
 const id=param(req,'id');
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false,error:'source writes must use /api/import'})}
 const hasPublicationGate=await publicationSchemaReady(db);
 const learnerVisibility=hasPublicationGate?`AND (NOT EXISTS(SELECT 1 FROM source_publications p WHERE p.source_id=s.id) OR EXISTS(SELECT 1 FROM source_publications p WHERE p.source_id=s.id AND p.status='PUBLISHED'))`:'';
 if(id){if(!UUID.test(id))return res.status(400).json({ok:false,error:'source id must be a UUID'});const source=await db.query(`SELECT s.id,s.type,s.title,s.author,s.original_uri,s.mime_type,s.content_hash,s.metadata,s.created_at FROM sources s WHERE s.id=$1 ${learnerVisibility}`,[id]);if(!source.rows[0])return res.status(404).json({ok:false,error:'source not found'});const fragments=await db.query('SELECT id,ordinal,raw_text,start_offset,end_offset,page,section,metadata FROM source_fragments WHERE source_id=$1 ORDER BY ordinal',[id]);return res.status(200).json({ok:true,source:source.rows[0],fragments:fragments.rows})}
 const{rows}=await db.query(`SELECT s.id,s.type,s.title,s.author,s.original_uri,s.mime_type,s.content_hash,s.metadata,s.created_at,COUNT(f.id)::int AS fragment_count FROM sources s LEFT JOIN source_fragments f ON f.source_id=s.id WHERE TRUE ${learnerVisibility} GROUP BY s.id ORDER BY s.created_at DESC`);
 return res.status(200).json({ok:true,sources:rows,documents:rows});
}

async function handleCrystals(req,res,db){
 const owner=ownerId(req);if(!owner)return res.status(400).json({ok:false,error:'x-eil-owner-id UUID header is required'});
 if(req.method==='GET'){const{rows}=await db.query('SELECT fragment_id AS "fragmentId",concept_id AS "conceptId",topic,subtopic,text_snapshot AS text,source_label AS "sourceLabel",provenance_label AS "provenanceLabel",saved_at AS "savedAt" FROM user_crystals WHERE owner_id=$1 ORDER BY saved_at DESC',[owner]);return res.status(200).json({ok:true,records:rows})}
 const body=req.body||{},fragmentId=text(body.fragmentId,{max:300});if(!fragmentId)return res.status(400).json({ok:false,error:'fragmentId is required'});
 if(req.method==='PUT'){const values=[owner,fragmentId,text(body.conceptId,{max:300}),text(body.topic,{max:300}),text(body.subtopic,{max:300}),text(body.text,{max:20_000,trim:false}),text(body.sourceLabel,{max:1000}),text(body.provenanceLabel,{max:1000})];const{rows}=await db.query(`INSERT INTO user_crystals(owner_id,fragment_id,concept_id,topic,subtopic,text_snapshot,source_label,provenance_label) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(owner_id,fragment_id) DO UPDATE SET concept_id=EXCLUDED.concept_id,topic=EXCLUDED.topic,subtopic=EXCLUDED.subtopic,text_snapshot=EXCLUDED.text_snapshot,source_label=EXCLUDED.source_label,provenance_label=EXCLUDED.provenance_label,updated_at=NOW() RETURNING fragment_id AS "fragmentId",concept_id AS "conceptId",topic,subtopic,text_snapshot AS text,source_label AS "sourceLabel",provenance_label AS "provenanceLabel",saved_at AS "savedAt"`,values);return res.status(200).json({ok:true,record:rows[0]})}
 if(req.method==='DELETE'){await db.query('DELETE FROM user_crystals WHERE owner_id=$1 AND fragment_id=$2',[owner,fragmentId]);return res.status(204).end()}
 res.setHeader('Allow','GET,PUT,DELETE');return res.status(405).json({ok:false,error:'method not allowed'});
}

async function handleTaxonomy(req,res,db){
 const owner=ownerId(req);if(!owner)return res.status(400).json({ok:false,error:'x-eil-owner-id UUID header is required'});
 if(req.method==='GET'){const{rows}=await db.query('SELECT fragment_id AS "fragmentId",topic_id AS "topicId",subtopic,approved,updated_at AS "updatedAt" FROM user_taxonomy_assignments WHERE owner_id=$1 ORDER BY updated_at DESC',[owner]);return res.status(200).json({ok:true,assignments:rows})}
 if(req.method==='PUT'){const body=req.body||{},fragmentId=text(body.fragmentId,{max:300}),topicId=text(body.topicId,{max:300});if(!fragmentId||!topicId)return res.status(400).json({ok:false,error:'fragmentId and topicId are required'});const{rows}=await db.query(`INSERT INTO user_taxonomy_assignments(owner_id,fragment_id,topic_id,subtopic,approved) VALUES($1,$2,$3,$4,$5) ON CONFLICT(owner_id,fragment_id) DO UPDATE SET topic_id=EXCLUDED.topic_id,subtopic=EXCLUDED.subtopic,approved=EXCLUDED.approved,updated_at=NOW() RETURNING fragment_id AS "fragmentId",topic_id AS "topicId",subtopic,approved,updated_at AS "updatedAt"`,[owner,fragmentId,topicId,text(body.subtopic,{max:300}),body.approved===true]);return res.status(200).json({ok:true,assignment:rows[0]})}
 res.setHeader('Allow','GET,PUT');return res.status(405).json({ok:false,error:'method not allowed'});
}

async function handleCorpusInventory(req,res,db){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false,error:'method not allowed'})}
 return res.status(200).json(await buildCorpusInventory(db));
}

async function handleAtomicPreview(req,res,db){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false,error:'method not allowed'})}
 const id=param(req,'id'),scope=param(req,'scope')||'source';
 if(scope==='corpus')return res.status(200).json(await previewCorpusExtraction(db,{samplePerSource:Number(param(req,'sample')||3)}));
 if(!id||!UUID.test(id))return res.status(400).json({ok:false,error:'source UUID id is required'});
 const result=await previewAtomicExtraction(db,id,{offset:Number(param(req,'offset')||0),limit:Number(param(req,'limit')||100)});
 return result?res.status(200).json(result):res.status(404).json({ok:false,error:'source not found'});
}

async function handleExtractionSummary(req,res,db){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false,error:'method not allowed'})}
 const tables=(await db.query(`SELECT to_regclass('public.extraction_candidates') AS candidates,to_regclass('public.extraction_candidate_evidence') AS evidence,to_regclass('public.extraction_runs') AS runs`)).rows[0];
 if(!tables?.candidates||!tables?.evidence||!tables?.runs)return res.status(200).json({ok:true,schemaReady:false,summary:null});
 const counts=(await db.query(`SELECT COUNT(*)::int AS total,COUNT(DISTINCT source_id)::int AS source_count,COUNT(*) FILTER(WHERE review_status='PENDING')::int AS pending,COUNT(*) FILTER(WHERE review_status='APPROVED')::int AS approved,COUNT(*) FILTER(WHERE review_status='REJECTED')::int AS rejected,COUNT(*) FILTER(WHERE exclude_from_knowledge)::int AS excluded FROM extraction_candidates`)).rows[0];
 const byType=(await db.query(`SELECT atom_type::text AS type,COUNT(*)::int AS count FROM extraction_candidates GROUP BY atom_type ORDER BY atom_type`)).rows;
 const evidence=(await db.query(`SELECT COUNT(*)::int AS edges,COUNT(*) FILTER(WHERE NOT exact_quote_verified)::int AS unverified_edges,(SELECT COUNT(*)::int FROM extraction_candidates c WHERE NOT EXISTS(SELECT 1 FROM extraction_candidate_evidence e WHERE e.candidate_id=c.id)) AS candidates_without_evidence FROM extraction_candidate_evidence`)).rows[0];
 const runs=(await db.query(`SELECT id,scope,extraction_method AS method,extractor_version AS version,status,stats,started_at AS "startedAt",completed_at AS "completedAt" FROM extraction_runs ORDER BY started_at DESC LIMIT 5`)).rows;
 const healthy=Number(evidence.unverified_edges)===0&&Number(evidence.candidates_without_evidence)===0;
 return res.status(200).json({ok:healthy,schemaReady:true,summary:{...counts,byType,evidence},runs});
}

async function handleOverlapPreview(req,res,db){
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({ok:false,error:'method not allowed'})}
 const input=text(req.body?.text,{max:20_000});if(input.length<2)return res.status(400).json({ok:false,error:'text is required'});
 return res.status(200).json(await matchAgainstCorpus(db,input,{topK:Number(req.body?.topK||8)}));
}

async function handleConceptRegistryPreview(req,res,db){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false,error:'method not allowed'})}
 return res.status(200).json(await buildConceptRegistryPreview(db,{duplicatesOnly:param(req,'duplicatesOnly')==='1',limit:Number(param(req,'limit')||100)}));
}

async function handleOverlapHealth(req,res,db){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false,error:'method not allowed'})}
 const fixtures=[
  {name:'known-exact',text:'מדיטציה',allowed:['EXISTS']},
  {name:'known-token',text:'נוירופלסטיות',allowed:['EXISTS','EXTENDS']},
  {name:'known-concept-paraphrase',text:'המוח מסוגל לבנות קשרים עצביים חדשים גם בבגרות',allowed:['RELATED','EXISTS']},
  {name:'known-extension',text:'מדיטציה יכולה להשפיע על תשומת הלב ועל דפוסי תרגול יומיומיים',allowed:['EXTENDS','RELATED','UNCERTAIN']},
  {name:'novel-control',text:'פוטוסינתזה בצמחי מנגרוב באוקיינוס הארקטי',allowed:['NEW','UNCERTAIN']},
 ];
 const results=[];
 for(const fixture of fixtures){
  const match=await matchAgainstCorpus(db,fixture.text,{topK:3}),top=match.matches[0];
  results.push({name:fixture.name,verdict:match.verdict,confidence:match.confidence,pass:fixture.allowed.includes(match.verdict),topScore:top?Number(top.score.toFixed(4)):null,topType:top?.type||null,topSourceFile:top?.sourceFile||null,indexed:match.indexed});
 }
 const pass=results.every(result=>result.pass);
 return res.status(pass?200:503).json({ok:pass,engine:'overlap-v0.2',semanticModel:false,conceptAwareMatching:true,results});
}

async function handlePublishedLearningCards(req,res,db){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false,error:'method not allowed'})}
 const chapter=Number(param(req,'chapter'));if(!Number.isInteger(chapter)||chapter<1||chapter>18)return res.status(400).json({ok:false,error:'chapter must be an integer from 1 to 18'});
 return res.status(200).json(await getPublishedLearningCards(db,{chapterNumber:chapter}));
}

async function handlePublicationHealth(req,res,db){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false,error:'method not allowed'})}
 const result=await getSourcePublicationHealth(db);return res.status(result.ok?200:503).json(result);
}

async function knowledge(req,res){
 const resource=param(req,'resource')||'sources';
 if(isProtectedWrite(resource,req.method)&&!requireEditor(req,res))return;
 const db=getDb();
 if(resource==='items')return handleItems(req,res,db);
 if(resource==='inbox')return handleInbox(req,res,db);
 if(resource==='sources'||resource==='documents')return handleSources(req,res,db);
 if(resource==='crystals')return handleCrystals(req,res,db);
 if(resource==='taxonomy')return handleTaxonomy(req,res,db);
 if(resource==='corpus-inventory')return handleCorpusInventory(req,res,db);
 if(resource==='atomic-extraction-preview')return handleAtomicPreview(req,res,db);
 if(resource==='extraction-summary')return handleExtractionSummary(req,res,db);
 if(resource==='overlap-preview')return handleOverlapPreview(req,res,db);
 if(resource==='concept-registry-preview')return handleConceptRegistryPreview(req,res,db);
 if(resource==='overlap-health')return handleOverlapHealth(req,res,db);
 if(resource==='published-learning-cards')return handlePublishedLearningCards(req,res,db);
 if(resource==='publication-health')return handlePublicationHealth(req,res,db);
 return res.status(404).json({ok:false,error:'unknown knowledge resource'});
}

export default withHardening(knowledge,{rateLimit:{limit:90,windowMs:60_000,keyPrefix:'knowledge'},maxBytes:2_000_000});
