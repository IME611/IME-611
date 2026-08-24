import{getDb}from'../server/shared/postgres.js';
import{resolveIntakeInput}from'../server/knowledge/application/intake/intake-input.service.js';
import{analyzeIntake}from'../server/knowledge/application/intake/intake-analysis.service.js';
import{stageIntakeSubmission,getIntakeSubmission,listIntakeSubmissions,changeIntakeSubmission,rejectIntakeSubmission,approveIntakeSubmission,intakeSchemaReady}from'../server/knowledge/application/intake/intake-review.service.js';
import{reviewOverview,listReviewQueue,applyReviewDecision}from'../server/knowledge/application/review/review-console.service.js';
import{withHardening,requestUrl}from'./_lib/hardening.js';
import{requireEditor}from'./_lib/editor-auth.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const param=(req,name)=>requestUrl(req).searchParams.get(name);
const reviewer=req=>String(req.body?.reviewedBy||req.headers?.['x-eil-reviewer']||'creator').trim().slice(0,300)||'creator';
function sendError(res,error){const status=Number(error?.status)||500,code=String(error?.code||'REVIEW_FAILED');return res.status(status).json({ok:false,error:String(error?.message||'review request failed').slice(0,500),code})}

async function handleLegacyReviews(req,res,db){
 await db.query(`CREATE TABLE IF NOT EXISTS knowledge_reviews(id BIGSERIAL PRIMARY KEY,knowledge_item_id BIGINT REFERENCES knowledge_items(id) ON DELETE CASCADE,relation_type TEXT NOT NULL,chapter_id INTEGER,category_id TEXT,score NUMERIC(8,3) NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'pending',note TEXT NOT NULL DEFAULT '',created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),reviewed_at TIMESTAMPTZ)`);
 if(req.method==='GET'){
  const itemId=Number(param(req,'itemId')),hasItem=Number.isInteger(itemId);const query=hasItem?'SELECT * FROM knowledge_reviews WHERE knowledge_item_id=$1 ORDER BY created_at DESC':'SELECT * FROM knowledge_reviews ORDER BY created_at DESC';const{rows}=hasItem?await db.query(query,[itemId]):await db.query(query);return res.status(200).json({ok:true,reviews:rows});
 }
 if(req.method==='POST'){
  const body=req.body||{},itemId=Number(body.knowledgeItemId);if(!Number.isInteger(itemId))return res.status(400).json({ok:false,error:'knowledgeItemId is required'});const relation=['MATCH','EXTENSION','GAP','CONFLICT','NEW'].includes(String(body.relationType))?String(body.relationType):'NEW';const{rows}=await db.query('INSERT INTO knowledge_reviews(knowledge_item_id,relation_type,chapter_id,category_id,score,note) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[itemId,relation,Number.isInteger(Number(body.chapterId))?Number(body.chapterId):null,body.categoryId?String(body.categoryId):null,Number(body.score||0),String(body.note||'')]);return res.status(201).json({ok:true,review:rows[0]});
 }
 if(req.method==='PATCH'){
  const id=Number(param(req,'id')),status=['pending','approved','rejected'].includes(String(req.body?.status))?String(req.body.status):'pending';if(!Number.isInteger(id))return res.status(400).json({ok:false,error:'id is required'});const{rows}=await db.query('UPDATE knowledge_reviews SET status=$1,reviewed_at=NOW(),note=$2 WHERE id=$3 RETURNING *',[status,String(req.body?.note||''),id]);return rows[0]?res.status(200).json({ok:true,review:rows[0]}):res.status(404).json({ok:false,error:'review not found'});
 }
 return res.status(405).json({ok:false,error:'method not allowed'});
}

async function handleIntake(req,res,db){
 if(!requireEditor(req,res))return;
 const id=param(req,'id');
 if(req.method==='POST'){
  const payload=await resolveIntakeInput(req.body||{}),analysis=await analyzeIntake(db,payload),staging=await stageIntakeSubmission(db,payload,analysis);return res.status(200).json({...analysis,staging});
 }
 if(req.method==='GET'){
  if(id){if(!UUID.test(id))return res.status(400).json({ok:false,error:'valid intake UUID id is required'});const item=await getIntakeSubmission(db,id,{includeText:param(req,'includeText')==='1'});return item?res.status(200).json({ok:true,schemaReady:true,item}):res.status(404).json({ok:false,error:'intake submission not found',schemaReady:await intakeSchemaReady(db)})}
  const result=await listIntakeSubmissions(db,{status:param(req,'status')||'PENDING',limit:Number(param(req,'limit')||20)});return res.status(200).json({ok:true,...result});
 }
 if(req.method==='PATCH'){
  if(!id||!UUID.test(id))return res.status(400).json({ok:false,error:'valid intake UUID id is required'});if(!await intakeSchemaReady(db))return res.status(503).json({ok:false,error:'intake review schema is not ready',code:'INTAKE_SCHEMA_NOT_READY'});
  const action=String(req.body?.action||'').trim().toUpperCase(),reviewedBy=reviewer(req),note=String(req.body?.note||'').slice(0,10_000);
  if(action==='CHANGE'){const item=await changeIntakeSubmission(db,id,{reviewedBy,overrides:req.body?.overrides||{},note});return res.status(200).json({ok:true,action,item,canonicalWrites:false})}
  if(action==='REJECT'){const item=await rejectIntakeSubmission(db,id,{reviewedBy,note});return res.status(200).json({ok:true,action,item,canonicalWrites:false})}
  if(action==='APPROVE'){const result=await approveIntakeSubmission(db,id,{reviewedBy,note});return res.status(200).json({ok:true,action,...result,canonicalWrites:{source:true,extractionCandidates:'PENDING_ONLY',concepts:false,relations:false}})}
  return res.status(400).json({ok:false,error:'action must be APPROVE, CHANGE, or REJECT'});
 }
 res.setHeader('Allow','GET,POST,PATCH');return res.status(405).json({ok:false,error:'method not allowed'});
}

async function handleIntakeHealth(req,res,db){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false,error:'method not allowed'})}
 const fixtures=[{name:'known-concept',text:'נוירופלסטיות',allowed:['EXISTS','EXTENDS']},{name:'known-concept-paraphrase',text:'המוח מסוגל לבנות קשרים עצביים חדשים גם בבגרות',allowed:['RELATED','EXISTS']},{name:'novel-control',text:'פוטוסינתזה בצמחי מנגרוב באוקיינוס הארקטי',allowed:['NEW','UNCERTAIN']}],results=[];
 for(const fixture of fixtures){const analysis=await analyzeIntake(db,{kind:'TOPIC',title:fixture.name,text:fixture.text,fileName:'health.txt',mimeType:'text/plain',sourceUrl:null,metadata:{verification:true}});results.push({name:fixture.name,verdict:analysis.verdict.verdict,confidence:analysis.verdict.confidence,pass:fixture.allowed.includes(analysis.verdict.verdict),closest:analysis.closestExistingKnowledge[0]||null,suggestedDrawer:analysis.placement.suggestedDrawer,decisionRequired:analysis.decision.required,canonicalWrites:analysis.policy.canonicalWrites})}
 const pass=results.every(item=>item.pass&&item.decisionRequired===true&&item.canonicalWrites===false);return res.status(pass?200:503).json({ok:pass,analysisVersion:'intake-v0.2',schemaReady:await intakeSchemaReady(db),semanticMatching:false,conceptAwareMatching:true,results});
}

async function handleConsole(req,res,db){
 if(!requireEditor(req,res))return;
 const queue=String(param(req,'queue')||'overview').toLowerCase();
 if(req.method==='GET'){
  if(queue==='overview')return res.status(200).json(await reviewOverview(db));
  const result=await listReviewQueue(db,{queue,limit:Number(param(req,'limit')||50)});return res.status(200).json({ok:true,...result});
 }
 if(req.method==='PATCH'){
  const result=await applyReviewDecision(db,{queue,id:String(req.body?.id||param(req,'id')||''),subjectKey:String(req.body?.subjectKey||''),action:String(req.body?.action||''),payload:req.body?.payload||{},reviewer:reviewer(req)});return res.status(200).json({ok:true,queue,action:String(req.body?.action||'').toUpperCase(),result});
 }
 res.setHeader('Allow','GET,PATCH');return res.status(405).json({ok:false,error:'method not allowed'});
}

async function handler(req,res){
 try{
  const mode=param(req,'mode');
  if(!mode&&!requireEditor(req,res))return;
  const db=getDb();
  if(mode==='intake')return await handleIntake(req,res,db);
  if(mode==='intake-health')return await handleIntakeHealth(req,res,db);
  if(mode==='console')return await handleConsole(req,res,db);
  return await handleLegacyReviews(req,res,db);
 }catch(error){console.error(error);return sendError(res,error)}
}

export default withHardening(handler,{rateLimit:{limit:30,windowMs:60_000,keyPrefix:'reviews-intake'},maxBytes:12_000_000});
