import{loadCorpus,normalizeText as n,readJson}from'../server/shared/corpus.js';
import{getDb}from'../server/shared/postgres.js';
import{PostgresCoreLoopRepository}from'../server/synthesis/infrastructure/postgres/core-loop.repository.js';
import{getInsightProvenanceTrace}from'../server/synthesis/infrastructure/postgres/provenance-trace.js';
import{createInsightFromClaims,createExperiment,reflectOnExperiment}from'../server/synthesis/domain/core-loop/core-loop.service.js';
function evidence(c,topic){const q=n(topic);return(c?.paragraphs||[]).map((text,i)=>({paragraph:i+1,text})).filter(x=>n(x.text).includes(q)).slice(0,2)}
const bad=(res,status,error)=>res.status(status).json({ok:false,error});
async function handleCoreLoop(req,res){
 if(!process.env.DATABASE_URL)return bad(res,503,'Canonical database is not configured. Local drafts must remain HYPOTHESIS.');
 const db=getDb(),repository=new PostgresCoreLoopRepository(db,getInsightProvenanceTrace);
 const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{}),action=body.action;
 if(req.method==='GET'){
  const id=req.query?.insightId;
  if(!id)return bad(res,400,'insightId is required');
  const trace=await repository.getInsightTrace(String(id));
  return res.json({ok:true,...trace});
 }
 if(req.method!=='POST')return bad(res,405,'Method not allowed');
 if(action==='create-insight')return res.json({ok:true,insight:await createInsightFromClaims({repository,statement:body.statement,claimIds:body.claimIds,modelConfidence:body.modelConfidence,metadata:body.metadata})});
 if(action==='create-experiment')return res.json({ok:true,experiment:await createExperiment({repository,insightId:body.insightId,hypothesis:body.hypothesis,action:body.experimentAction,expectedSignal:body.expectedSignal})});
 if(action==='reflect')return res.json({ok:true,...await reflectOnExperiment({repository,experimentId:body.experimentId,observation:body.observation,outcome:body.outcome,interpretation:body.interpretation})});
 return bad(res,400,'Unknown core loop action');
}
export default async function handler(req,res){try{
 if(req.query?.mode==='core-loop')return await handleCoreLoop(req,res);
 if(req.method!=='GET')return bad(res,405,'Method not allowed');
 const map=readJson('data/content-map.json'),cs=loadCorpus();const insights=map.crossCuttingTopics.map((t,i)=>{const ev=t.chapters.flatMap(id=>evidence(cs.find(c=>c.number===id),t.topic).map(x=>({chapter:id,sourceFile:cs.find(c=>c.number===id)?.sourceFile||'',...x})));return{id:`topic-${i+1}`,type:'cross-document',title:`${t.topic} מחבר ${t.chapters.length} פרקים`,topic:t.topic,chapters:t.chapters,confidence:ev.length>=3?'high':ev.length?'medium':'mapped',evidence:ev.slice(0,8),traceable:ev.length>0}});const overlaps=[];for(let a=0;a<map.chapters.length;a++)for(let b=a+1;b<map.chapters.length;b++){const A=map.chapters[a],B=map.chapters[b],shared=A.topics.filter(x=>B.topics.some(y=>n(x)===n(y)));if(shared.length)overlaps.push({chapters:[A.id,B.id],sharedTopics:shared,kind:'topic-overlap'})}return res.json({ok:true,sourceMode:'lossless-docx-text',insights,overlaps:overlaps.slice(0,40),contradictions:[],contradictionStatus:'not-asserted-without-semantic-evidence',policy:'derived knowledge never replaces source; every asserted insight carries source evidence'})
}catch(e){const m=e?.message||'Insights failed';return bad(res,/provenance|evidence|claim|required/i.test(m)?422:500,m)}}