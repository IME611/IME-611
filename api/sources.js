import pg from 'pg';
const {Pool}=pg;
const pool=process.env.POSTGRES_URL?new Pool({connectionString:process.env.POSTGRES_URL,ssl:{rejectUnauthorized:false}}):null;
const json=(res,status,body)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(body))};
const chunkText=(text,size=1800,overlap=250)=>{const out=[];let start=0,i=0;while(start<text.length){let end=Math.min(text.length,start+size);if(end<text.length){const cut=Math.max(text.lastIndexOf('\n',end),text.lastIndexOf('. ',end));if(cut>start+size*.55)end=cut+1}out.push({index:i++,content:text.slice(start,end),start,end});if(end>=text.length)break;start=Math.max(start+1,end-overlap)}return out};
export default async function handler(req,res){
 if(!pool)return json(res,503,{error:'POSTGRES_URL is not configured'});
 try{
  if(req.method==='GET'){const {rows}=await pool.query(`SELECT id,title,file_name,mime_type,byte_size,sha256,source_url,author,metadata,created_at,length(original_text) AS text_length FROM source_documents ORDER BY created_at DESC LIMIT 100`);return json(res,200,{sources:rows})}
  if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
  const b=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});const title=String(b.title||b.fileName||'').trim();const text=String(b.originalText||'');
  if(!title||!text)return json(res,400,{error:'title and originalText are required'});
  const client=await pool.connect();try{await client.query('BEGIN');
   const ins=await client.query(`INSERT INTO source_documents(title,file_name,mime_type,byte_size,sha256,original_text,original_file_base64,source_url,author,metadata) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb) ON CONFLICT (sha256) WHERE sha256 <> '' DO UPDATE SET title=EXCLUDED.title RETURNING id,title,file_name,sha256`,[title,String(b.fileName||''),String(b.mimeType||'text/plain'),Number(b.byteSize||0),String(b.sha256||''),text,String(b.originalFileBase64||''),String(b.sourceUrl||''),String(b.author||''),JSON.stringify(b.metadata||{})]);
   const source=ins.rows[0];await client.query('DELETE FROM document_chunks WHERE source_document_id=$1',[source.id]);const chunks=chunkText(text);for(const c of chunks)await client.query(`INSERT INTO document_chunks(source_document_id,chunk_index,content,start_char,end_char) VALUES($1,$2,$3,$4,$5)`,[source.id,c.index,c.content,c.start,c.end]);
   await client.query('COMMIT');return json(res,201,{source,chunks:chunks.length,preserved:true});
  }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
 }catch(e){return json(res,500,{error:e.message||'Source ingestion failed'})}
}