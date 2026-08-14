import{getDb}from'../server/shared/postgres.js';
import{buildCorpusInventory}from'../server/knowledge/application/corpus/corpus-inventory.service.js';
import{previewAtomicExtraction,previewCorpusExtraction}from'../server/knowledge/application/extraction/atomic-extraction-preview.service.js';
import{withHardening,text,requestUrl}from'./_lib/hardening.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const param=(req,name)=>requestUrl(req).searchParams.get(name);
const positiveId=value=>{if(value===null)return null;const id=Number(value);return Number.isInteger(id)&&id>0?id:NaN};
const ownerId=req=>{const value=String(req.headers?.['x-eil-owner-id']||'').trim();return UUID.test(value)?value:null};

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
 if(id){if(!UUID.test(id))return res.status(400).json({ok:false,error:'source id must be a UUID'});const source=await db.query('SELECT id,type,title,author,original_uri,mime_type,content_hash,metadata,created_at FROM sources WHERE id=$1',[id]);if(!source.rows[0])return res.status(404).json({ok:false,error:'source not found'});const fragments=await db.query('SELECT id,ordinal,raw_text,start_offset,end_offset,page,section,metadata FROM source_fragments WHERE source_id=$1 ORDER BY ordinal',[id]);return res.status(200).json({ok:true,source:source.rows[0],fragments:fragments.rows})}
 const{rows}=await db.query(`SELECT s.id,s.type,s.title,s.author,s.original_uri,s.mime_type,s.content_hash,s.metadata,s.created_at,COUNT(f.id)::int AS fragment_count FROM sources s LEFT JOIN source_fragments f ON f.source_id=s.id GROUP BY s.id ORDER BY s.created_at DESC`);
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

async function knowledge(req,res){
 const db=getDb();const resource=param(req,'resource')||'sources';
 if(resource==='items')return handleItems(req,res,db);
 if(resource==='inbox')return handleInbox(req,res,db);
 if(resource==='sources'||resource==='documents')return handleSources(req,res,db);
 if(resource==='crystals')return handleCrystals(req,res,db);
 if(resource==='taxonomy')return handleTaxonomy(req,res,db);
 if(resource==='corpus-inventory')return handleCorpusInventory(req,res,db);
 if(resource==='atomic-extraction-preview')return handleAtomicPreview(req,res,db);
 return res.status(404).json({ok:false,error:'unknown knowledge resource'});
}

export default withHardening(knowledge,{rateLimit:{limit:90,windowMs:60_000,keyPrefix:'knowledge'},maxBytes:2_000_000});
