import{getDb}from'../server/shared/postgres.js';
import{buildEmergentCorpusMapPreview}from'../server/knowledge/application/map/emergent-corpus-map.service.js';
import{buildContentLibraryIndex,buildContentLibraryDetail}from'../server/knowledge/application/library/content-library.service.js';
import{withHardening,requestUrl}from'./_lib/hardening.js';

const numberParam=(url,name,fallback,max)=>{
 const raw=url.searchParams.get(name);if(raw===null)return fallback;
 const value=Number(raw);if(!Number.isInteger(value)||value<1)return fallback;
 return Math.min(max,value);
};

async function corpusMap(req,res){
 if(req.method!=='GET'){
  res.setHeader('Allow','GET');
  return res.status(405).json({ok:false,error:'method not allowed'});
 }
 const url=requestUrl(req),db=getDb(),view=url.searchParams.get('view');
 if(view==='library'){
  const nodeId=String(url.searchParams.get('nodeId')||'').trim();
  if(nodeId){
   if(nodeId.length>300)return res.status(400).json({ok:false,error:'nodeId is too long'});
   const detail=await buildContentLibraryDetail(db,nodeId);
   return detail?res.status(200).json(detail):res.status(404).json({ok:false,error:'topic not found'});
  }
  return res.status(200).json(await buildContentLibraryIndex(db));
 }
 const result=await buildEmergentCorpusMapPreview(db,{
  communityLimit:numberParam(url,'communityLimit',30,200),
  nodeLimit:numberParam(url,'nodeLimit',150,500),
  edgeLimit:numberParam(url,'edgeLimit',250,1000),
 });
 return res.status(200).json(result);
}

export default withHardening(corpusMap,{rateLimit:{limit:60,windowMs:60_000,keyPrefix:'corpus-map'}});
