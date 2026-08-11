import{getDb}from'../server/shared/postgres.js';
import{PostgresCoreLoopRepository}from'../server/synthesis/infrastructure/postgres/core-loop.repository.js';
import{getInsightProvenanceTrace}from'../server/synthesis/infrastructure/postgres/provenance-trace.js';
import{createInsightFromClaims,createExperiment,reflectOnExperiment}from'../server/synthesis/domain/core-loop/core-loop.service.js';
const bad=(res,status,error)=>res.status(status).json({ok:false,error});
export default async function handler(req,res){
 try{
  if(!process.env.DATABASE_URL)return bad(res,503,'Canonical database is not configured. Local drafts must remain HYPOTHESIS.');
  const db=getDb(),repository=new PostgresCoreLoopRepository(db,getInsightProvenanceTrace);
  const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{}),action=body.action;
  if(req.method==='GET'){
   if(!req.query?.insightId)return bad(res,400,'insightId is required');
   const trace=await repository.getInsightTrace(String(req.query.insightId));
   return res.json({ok:true,...trace});
  }
  if(req.method!=='POST')return bad(res,405,'Method not allowed');
  if(action==='create-insight')return res.json({ok:true,insight:await createInsightFromClaims({repository,statement:body.statement,claimIds:body.claimIds,modelConfidence:body.modelConfidence,metadata:body.metadata})});
  if(action==='create-experiment')return res.json({ok:true,experiment:await createExperiment({repository,insightId:body.insightId,hypothesis:body.hypothesis,action:body.experimentAction,expectedSignal:body.expectedSignal})});
  if(action==='reflect')return res.json({ok:true,...await reflectOnExperiment({repository,experimentId:body.experimentId,observation:body.observation,outcome:body.outcome,interpretation:body.interpretation})});
  return bad(res,400,'Unknown core loop action');
 }catch(e){const m=e?.message||'Core loop failed';return bad(res,/provenance|evidence|claim|required/i.test(m)?422:500,m)}
}
