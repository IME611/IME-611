import{getDb}from'../server/shared/postgres.js';
import{buildContentLibraryIndex,buildContentLibraryDetail}from'../server/knowledge/application/library/content-library.service.js';
import{withHardening,requestUrl}from'./_lib/hardening.js';

async function contentLibrary(req,res){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false,error:'method not allowed'})}
 const url=requestUrl(req),nodeId=String(url.searchParams.get('nodeId')||'').trim(),db=getDb();
 if(nodeId){if(nodeId.length>300)return res.status(400).json({ok:false,error:'nodeId is too long'});const detail=await buildContentLibraryDetail(db,nodeId);return detail?res.status(200).json(detail):res.status(404).json({ok:false,error:'topic not found'})}
 return res.status(200).json(await buildContentLibraryIndex(db));
}
export default withHardening(contentLibrary,{rateLimit:{limit:60,windowMs:60_000,keyPrefix:'content-library'}});
