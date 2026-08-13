import mammoth from'mammoth';
import{PDFParse}from'pdf-parse';
import{getDb}from'../server/shared/postgres.js';
import{ingestCanonicalSource}from'../server/knowledge/application/ingestion/ingest-source.js';
import{PostgresSourceIngestionRepository}from'../server/knowledge/infrastructure/postgres/source-ingestion.repository.js';
import{withHardening,text as safeText}from'./_lib/hardening.js';

async function extract(fileName,mimeType,base64,suppliedText){
 if(String(suppliedText||'').trim())return String(suppliedText);
 const bytes=Buffer.from(String(base64||''),'base64');
 const lower=fileName.toLowerCase();
 if(lower.endsWith('.pdf')||mimeType==='application/pdf'){
  const parser=new PDFParse({data:bytes});
  try{const result=await parser.getText();return String(result.text||'')}finally{await parser.destroy()}
 }
 if(lower.endsWith('.docx')||mimeType.includes('wordprocessingml')){
  const result=await mammoth.extractRawText({buffer:bytes});
  return result.value;
 }
 if(lower.match(/\.(txt|md|csv|json|html?)$/)||mimeType.startsWith('text/'))return bytes.toString('utf8');
 throw new Error('unsupported file type');
}

async function importSource(db,body,fileName,mimeType,base64,extractedText){
 const originalBytes=base64?Buffer.from(base64,'base64'):Buffer.from(extractedText,'utf8');
 const repository=new PostgresSourceIngestionRepository(db);
 const result=await ingestCanonicalSource({
  db,
  repository,
  input:{
   originalBytes,
   extractedText,
   fileName,
   mimeType,
   title:safeText(body.title||fileName.replace(/\.[^.]+$/,''),{max:500}),
   author:safeText(body.author,{max:500}),
   originalUri:body.sourceUrl?safeText(body.sourceUrl,{max:2_000}):null,
  },
 });
 return{
  ok:true,
  canonical:true,
  deduplicated:result.deduplicated,
  source:result.source,
  fragmentCount:result.fragments.length,
  preservedCharacters:extractedText.length,
 };
}

async function importHandler(req,res){
 if(req.method!=='POST')return res.status(405).json({ok:false,error:'method not allowed'});
 const body=req.body||{};
 const fileName=safeText(body.fileName||body.sourceFilename||'document.txt',{max:500});
 const mimeType=safeText(body.mimeType||'text/plain',{max:200});
 const base64=String(body.fileBase64||'');
 const extractedText=await extract(fileName,mimeType,base64,body.text);
 if(!extractedText.trim())return res.status(400).json({ok:false,error:'document contains no readable text'});
 try{
  const payload=await importSource(getDb(),body,fileName,mimeType,base64,extractedText);
  return res.status(payload.deduplicated?200:201).json(payload);
 }catch(error){
  const message=String(error?.message||'canonical import failed');
  if(/relation .* does not exist/i.test(message)||/type .* does not exist/i.test(message))return res.status(503).json({ok:false,canonical:true,error:'Knowledge migrations have not been applied yet.'});
  throw error;
 }
}

export default withHardening(importHandler,{rateLimit:{limit:20,windowMs:60_000,keyPrefix:'import'},maxBytes:12_000_000});
