import fs from'fs';
import path from'path';
import{loadCorpus,normalizeText as n,readJson}from'../server/shared/corpus.js';
import{getDb}from'../server/shared/postgres.js';
import{requestUrl}from'./_lib/hardening.js';
import{PostgresCoreLoopRepository}from'../server/synthesis/infrastructure/postgres/core-loop.repository.js';
import{PostgresDashboardRepository}from'../server/synthesis/infrastructure/postgres/dashboard.repository.js';
import{getInsightProvenanceTrace}from'../server/synthesis/infrastructure/postgres/provenance-trace.js';
import{createInsightFromClaims,createExperiment,reflectOnExperiment}from'../server/synthesis/domain/core-loop/core-loop.service.js';

function evidence(c,topic){const q=n(topic);return(c?.paragraphs||[]).map((text,i)=>({paragraph:i+1,text})).filter(x=>n(x.text).includes(q)).slice(0,2)}
const bad=(res,status,error)=>res.status(status).json({ok:false,error});

async function handleCoreLoop(req,res,params){
 if(!process.env.DATABASE_URL)return bad(res,503,'Canonical database is not configured. Local drafts must remain HYPOTHESIS.');
 const db=getDb(),repository=new PostgresCoreLoopRepository(db,getInsightProvenanceTrace);
 const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{}),action=body.action;
 if(req.method==='GET'){
  const id=params.get('insightId');
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

async function handleDashboard(req,res){
 if(req.method!=='GET')return bad(res,405,'Method not allowed');
 if(!process.env.DATABASE_URL)return bad(res,503,'Canonical database is not configured');
 const snapshot=await new PostgresDashboardRepository(getDb()).getSnapshot();
 return res.json({ok:true,...snapshot});
}

async function handleMatch(req,res){
 if(req.method!=='POST')return bad(res,405,'Method not allowed');
 const body=req.body||{},query=String(body.text||'').toLowerCase().trim();
 if(!query)return bad(res,400,'text is required');
 let data;try{data=JSON.parse(fs.readFileSync(path.join(process.cwd(),'data/content-map.json'),'utf8'))}catch{return bad(res,500,'content map unavailable')}
 const tokens=[...new Set(query.split(/[^\p{L}\p{N}]+/u).filter(value=>value.length>2))];
 const score=topics=>topics.reduce((total,topic)=>total+(tokens.some(token=>topic.toLowerCase().includes(token)||token.includes(topic.toLowerCase()))?1:0),0);
 const matches=data.chapters.map(chapter=>({id:chapter.id,title:chapter.title,category:chapter.primary,topics:chapter.topics,score:score(chapter.topics)})).filter(item=>item.score>0).sort((a,b)=>b.score-a.score).slice(0,8);
 const categories=data.categories.map(category=>({id:category.id,label:category.label,score:score(category.topics)})).filter(item=>item.score>0).sort((a,b)=>b.score-a.score);
 return res.json({ok:true,matches,categories,classification:categories[0]?.id||null});
}

export default async function handler(req,res){try{
 const params=requestUrl(req).searchParams,mode=params.get('mode');
 if(mode==='core-loop')return await handleCoreLoop(req,res,params);
 if(mode==='dashboard')return await handleDashboard(req,res);
 if(mode==='match')return await handleMatch(req,res);
 if(req.method!=='GET')return bad(res,405,'Method not allowed');
 const map=readJson('data/content-map.json'),cs=loadCorpus();
 const insights=map.crossCuttingTopics.map((topic,index)=>{
  const ev=topic.chapters.flatMap(id=>evidence(cs.find(c=>c.number===id),topic.topic).map(item=>({chapter:id,sourceFile:cs.find(c=>c.number===id)?.sourceFile||'',...item})));
  return{id:`topic-${index+1}`,type:'cross-document',title:`${topic.topic} מחבר ${topic.chapters.length} פרקים`,topic:topic.topic,chapters:topic.chapters,confidence:ev.length>=3?'high':ev.length?'medium':'mapped',evidence:ev.slice(0,8),traceable:ev.length>0};
 });
 const overlaps=[];
 for(let a=0;a<map.chapters.length;a++)for(let b=a+1;b<map.chapters.length;b++){const A=map.chapters[a],B=map.chapters[b],shared=A.topics.filter(x=>B.topics.some(y=>n(x)===n(y)));if(shared.length)overlaps.push({chapters:[A.id,B.id],sharedTopics:shared,kind:'topic-overlap'})}
 return res.json({ok:true,sourceMode:'lossless-docx-text',insights,overlaps:overlaps.slice(0,40),contradictions:[],contradictionStatus:'not-asserted-without-semantic-evidence',policy:'derived knowledge never replaces source; every asserted insight carries source evidence'});
}catch(error){const message=error?.message||'Insights failed';return bad(res,/provenance|evidence|claim|required/i.test(message)?422:500,message)}}
