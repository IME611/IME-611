import{getDb}from'../server/shared/postgres.js';
import{previewLearningDependencyGraph}from'../server/knowledge/application/learning/learning-dependency.service.js';
import{withHardening,requestUrl}from'./_lib/hardening.js';

const bounded=(url,name,fallback,max)=>{const value=Number(url.searchParams.get(name)||fallback);return Number.isInteger(value)&&value>0?Math.min(max,value):fallback};
async function learningGraph(req,res){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false,error:'method not allowed'})}
 const url=requestUrl(req),result=await previewLearningDependencyGraph(getDb(),{unitLimit:bounded(url,'unitLimit',100,500),spiralLimit:bounded(url,'spiralLimit',100,500),dependencyLimit:bounded(url,'dependencyLimit',200,1000)});
 return res.status(result.ok?200:409).json(result);
}
export default withHardening(learningGraph,{rateLimit:{limit:30,windowMs:60_000,keyPrefix:'learning-graph'}});
