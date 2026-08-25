import{getDb}from'../server/shared/postgres.js';
import{previewLearningDependencyGraph}from'../server/knowledge/application/learning/learning-dependency.service.js';
import{getLearnerPublishedCardsForLearningUnit,listPublishedLearningUnits}from'../server/knowledge/application/publication/learner-publication.service.js';
import{withHardening,requestUrl}from'./_lib/hardening.js';

const bounded=(url,name,fallback,max)=>{const value=Number(url.searchParams.get(name)||fallback);return Number.isInteger(value)&&value>0?Math.min(max,value):fallback};
async function learningGraph(req,res){
 try{
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false,error:'method not allowed'})}
  const url=requestUrl(req),resource=url.searchParams.get('resource')||'graph',db=getDb();
  if(resource==='published-units'){
   const learningUnitKey=url.searchParams.get('learningUnitKey');
   return res.status(200).json(learningUnitKey?await getLearnerPublishedCardsForLearningUnit(db,learningUnitKey):await listPublishedLearningUnits(db));
  }
  if(resource!=='graph')return res.status(404).json({ok:false,error:'unknown learning resource'});
  const result=await previewLearningDependencyGraph(db,{unitLimit:bounded(url,'unitLimit',100,500),spiralLimit:bounded(url,'spiralLimit',100,500),dependencyLimit:bounded(url,'dependencyLimit',200,1000)});
  return res.status(result.ok?200:409).json(result);
 }catch(error){
  const status=Number(error?.status)||500;
  return res.status(status).json({ok:false,error:String(error?.message||'learning request failed').slice(0,500),code:String(error?.code||'LEARNING_REQUEST_FAILED')});
 }
}
export default withHardening(learningGraph,{rateLimit:{limit:60,windowMs:60_000,keyPrefix:'learning-graph'},maxBytes:250_000});
