import{getDb}from'../server/shared/postgres.js';
import{getLearnerPublishedCardsForLearningUnit,listPublishedLearningUnits}from'../server/knowledge/application/publication/learner-publication.service.js';
import{withHardening,requestUrl}from'./_lib/hardening.js';

const param=(req,name)=>requestUrl(req).searchParams.get(name);

async function handler(req,res){
 try{
  if(req.method!=='GET'){
   res.setHeader('Allow','GET');
   return res.status(405).json({ok:false,error:'method not allowed'});
  }
  const db=getDb(),learningUnitKey=param(req,'learningUnitKey');
  if(learningUnitKey)return res.status(200).json(await getLearnerPublishedCardsForLearningUnit(db,learningUnitKey));
  return res.status(200).json(await listPublishedLearningUnits(db));
 }catch(error){
  const status=Number(error?.status)||500;
  return res.status(status).json({ok:false,error:String(error?.message||'learning publication request failed').slice(0,500),code:String(error?.code||'LEARNING_PUBLICATION_FAILED')});
 }
}

export default withHardening(handler,{rateLimit:{limit:90,windowMs:60_000,keyPrefix:'learning-publications'},maxBytes:250_000});
