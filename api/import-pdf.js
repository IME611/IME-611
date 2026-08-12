import pg from'pg';
import{PDFParse}from'pdf-parse';
import{ingestCanonicalSource}from'../server/knowledge/application/ingestion/ingest-source.js';
import{PostgresSourceIngestionRepository}from'../server/knowledge/infrastructure/postgres/source-ingestion.repository.js';
const{Pool}=pg;let pool;
const db=()=>pool??(pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==='false'?false:{rejectUnauthorized:false},max:3}));
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({ok:false,error:'method not allowed'});
 if(!process.env.DATABASE_URL)return res.status(503).json({ok:false,error:'DATABASE_URL is not configured'});
 try{
  const body=req.body||{},b64=String(body.fileBase64||''),fileName=String(body.sourceFilename||body.fileName||'document.pdf');
  if(!b64)return res.status(400).json({ok:false,error:'PDF bytes are required'});
  const bytes=Buffer.from(b64,'base64');
  const parser=new PDFParse({data:bytes});let text='';
  try{text=String((await parser.getText()).text||'')}finally{await parser.destroy()}
  if(!text.trim())return res.status(400).json({ok:false,error:'PDF contains no extractable text'});
  const c=db(),repository=new PostgresSourceIngestionRepository(c);
  const result=await ingestCanonicalSource({db:c,repository,input:{originalBytes:bytes,extractedText:text,fileName,mimeType:'application/pdf',title:String(body.title||fileName.replace(/\.pdf$/i,'')),author:String(body.author||''),originalUri:body.sourceUrl?String(body.sourceUrl):null}});
  return res.status(result.deduplicated?200:201).json({ok:true,canonical:true,deduplicated:result.deduplicated,source:result.source,fragmentCount:result.fragments.length,preservedCharacters:text.length,pdf:true});
 }catch(error){console.error(error);return res.status(400).json({ok:false,error:error?.message||'PDF import failed'})}
}
