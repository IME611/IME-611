import{getDb}from'../server/shared/postgres.js';
import{previewExplicitRelations}from'../server/knowledge/application/relations/explicit-relation.service.js';
import{withHardening,requestUrl}from'./_lib/hardening.js';

async function relations(req,res){
 if(req.method!=='GET'){
  res.setHeader('Allow','GET');
  return res.status(405).json({ok:false,error:'method not allowed'});
 }
 const url=requestUrl(req),raw=Number(url.searchParams.get('limit')||200),limit=Number.isInteger(raw)&&raw>0?Math.min(1000,raw):200;
 return res.status(200).json(await previewExplicitRelations(getDb(),{limit}));
}

export default withHardening(relations,{rateLimit:{limit:30,windowMs:60_000,keyPrefix:'relations-preview'}});
