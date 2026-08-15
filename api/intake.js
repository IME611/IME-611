import{getDb}from'../server/shared/postgres.js';
import{resolveIntakeInput}from'../server/knowledge/application/intake/intake-input.service.js';
import{analyzeIntake}from'../server/knowledge/application/intake/intake-analysis.service.js';
import{stageIntakeSubmission,getIntakeSubmission,listIntakeSubmissions,changeIntakeSubmission,rejectIntakeSubmission,approveIntakeSubmission,intakeSchemaReady}from'../server/knowledge/application/intake/intake-review.service.js';
import{withHardening,requestUrl}from'./_lib/hardening.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const reviewer=req=>String(req.body?.reviewedBy||req.headers?.['x-eil-reviewer']||'').trim().slice(0,300);
function sendError(res,error){const status=Number(error?.status)||500,code=String(error?.code||'INTAKE_FAILED');return res.status(status).json({ok:false,error:String(error?.message||'intake failed'),code})}

async function intake(req,res){
 const db=getDb(),url=requestUrl(req),id=url.searchParams.get('id');
 try{
  if(req.method==='POST'){
   const payload=await resolveIntakeInput(req.body||{}),analysis=await analyzeIntake(db,payload),staging=await stageIntakeSubmission(db,payload,analysis);
   return res.status(200).json({...analysis,staging});
  }
  if(req.method==='GET'){
   if(id){if(!UUID.test(id))return res.status(400).json({ok:false,error:'valid intake UUID id is required'});const item=await getIntakeSubmission(db,id,{includeText:url.searchParams.get('includeText')==='1'});return item?res.status(200).json({ok:true,schemaReady:true,item}):res.status(404).json({ok:false,error:'intake submission not found',schemaReady:await intakeSchemaReady(db)})}
   const result=await listIntakeSubmissions(db,{status:url.searchParams.get('status')||'PENDING',limit:Number(url.searchParams.get('limit')||20)});return res.status(200).json({ok:true,...result});
  }
  if(req.method==='PATCH'){
   if(!id||!UUID.test(id))return res.status(400).json({ok:false,error:'valid intake UUID id is required'});
   if(!await intakeSchemaReady(db))return res.status(503).json({ok:false,error:'intake review schema is not ready',code:'INTAKE_SCHEMA_NOT_READY'});
   const action=String(req.body?.action||'').trim().toUpperCase(),reviewedBy=reviewer(req),note=String(req.body?.note||'').slice(0,10_000);
   if(action==='CHANGE'){const item=await changeIntakeSubmission(db,id,{reviewedBy,overrides:req.body?.overrides||{},note});return res.status(200).json({ok:true,action,item,canonicalWrites:false})}
   if(action==='REJECT'){const item=await rejectIntakeSubmission(db,id,{reviewedBy,note});return res.status(200).json({ok:true,action,item,canonicalWrites:false})}
   if(action==='APPROVE'){const result=await approveIntakeSubmission(db,id,{reviewedBy,note});return res.status(200).json({ok:true,action,...result,canonicalWrites:{source:true,extractionCandidates:'PENDING_ONLY',concepts:false,relations:false}})}
   return res.status(400).json({ok:false,error:'action must be APPROVE, CHANGE, or REJECT'});
  }
  res.setHeader('Allow','GET,POST,PATCH');return res.status(405).json({ok:false,error:'method not allowed'});
 }catch(error){return sendError(res,error)}
}

export default withHardening(intake,{rateLimit:{limit:20,windowMs:60_000,keyPrefix:'intake'},maxBytes:12_000_000});
