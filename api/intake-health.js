import{getDb}from'../server/shared/postgres.js';
import{analyzeIntake}from'../server/knowledge/application/intake/intake-analysis.service.js';
import{intakeSchemaReady}from'../server/knowledge/application/intake/intake-review.service.js';
import{withHardening}from'./_lib/hardening.js';

async function intakeHealth(req,res){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false,error:'method not allowed'})}
 const db=getDb(),fixtures=[
  {name:'known-concept',text:'נוירופלסטיות',allowed:['EXISTS','EXTENDS']},
  {name:'novel-control',text:'פוטוסינתזה בצמחי מנגרוב באוקיינוס הארקטי',allowed:['NEW','UNCERTAIN']},
 ],results=[];
 for(const fixture of fixtures){
  const analysis=await analyzeIntake(db,{kind:'TOPIC',title:fixture.name,text:fixture.text,fileName:'health.txt',mimeType:'text/plain',sourceUrl:null,metadata:{verification:true}});
  results.push({name:fixture.name,verdict:analysis.verdict.verdict,confidence:analysis.verdict.confidence,pass:fixture.allowed.includes(analysis.verdict.verdict),closest:analysis.closestExistingKnowledge[0]||null,suggestedDrawer:analysis.placement.suggestedDrawer,decisionRequired:analysis.decision.required,canonicalWrites:analysis.policy.canonicalWrites});
 }
 const pass=results.every(item=>item.pass&&item.decisionRequired===true&&item.canonicalWrites===false);
 return res.status(pass?200:503).json({ok:pass,analysisVersion:'intake-v0.1',schemaReady:await intakeSchemaReady(db),semanticMatching:false,results});
}

export default withHardening(intakeHealth,{rateLimit:{limit:10,windowMs:60_000,keyPrefix:'intake-health'}});
