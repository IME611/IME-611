import{getDb}from'../server/shared/postgres.js';
import{withHardening,text,requestUrl}from'./_lib/hardening.js';

async function items(req,res){
 const db=getDb();
 const params=requestUrl(req).searchParams;
 const rawId=params.get('id');
 const id=rawId===null?null:Number(rawId);
 const hasId=id!==null&&Number.isInteger(id)&&id>0;
 if(req.method==='GET'){
  if(hasId){
   const{rows}=await db.query('SELECT * FROM knowledge_items WHERE id=$1',[id]);
   return rows[0]?res.status(200).json({ok:true,item:rows[0]}):res.status(404).json({ok:false,error:'item not found'});
  }
  if(rawId!==null)return res.status(400).json({ok:false,error:'id must be a positive integer'});
  const q=text(params.get('q'),{max:240});
  const{rows}=q
   ?await db.query(`SELECT * FROM knowledge_items WHERE title ILIKE $1 OR content ILIKE $1 OR source ILIKE $1 OR EXISTS(SELECT 1 FROM unnest(tags) t WHERE t ILIKE $1) ORDER BY updated_at DESC`,[`%${q}%`])
   :await db.query('SELECT * FROM knowledge_items ORDER BY updated_at DESC');
  return res.status(200).json({ok:true,items:rows});
 }
 if(req.method==='POST'){
  const b=req.body||{},title=text(b.title,{max:500});
  if(!title)return res.status(400).json({ok:false,error:'title is required'});
  const{rows}=await db.query('INSERT INTO knowledge_items(title,kind,content,tags,source) VALUES($1,$2,$3,$4,$5) RETURNING *',[title,text(b.kind||'ידע',{max:120}),text(b.content,{max:200_000,trim:false}),Array.isArray(b.tags)?b.tags.slice(0,50).map(tag=>text(tag,{max:100})):[],text(b.source,{max:2_000})]);
  return res.status(201).json({ok:true,item:rows[0]});
 }
 if(req.method==='PUT'){
  if(!hasId)return res.status(400).json({ok:false,error:'id is required'});
  const b=req.body||{},title=text(b.title,{max:500});
  if(!title)return res.status(400).json({ok:false,error:'title is required'});
  const{rows}=await db.query('UPDATE knowledge_items SET title=$1,kind=$2,content=$3,tags=$4,source=$5,updated_at=NOW() WHERE id=$6 RETURNING *',[title,text(b.kind||'ידע',{max:120}),text(b.content,{max:200_000,trim:false}),Array.isArray(b.tags)?b.tags.slice(0,50).map(tag=>text(tag,{max:100})):[],text(b.source,{max:2_000}),id]);
  return rows[0]?res.status(200).json({ok:true,item:rows[0]}):res.status(404).json({ok:false,error:'item not found'});
 }
 if(req.method==='DELETE'){
  if(!hasId)return res.status(400).json({ok:false,error:'id is required'});
  await db.query('DELETE FROM knowledge_items WHERE id=$1',[id]);
  return res.status(204).end();
 }
 res.setHeader('Allow','GET,POST,PUT,DELETE');
 return res.status(405).json({ok:false,error:'method not allowed'});
}

export default withHardening(items,{rateLimit:{limit:60,windowMs:60_000,keyPrefix:'items'},maxBytes:2_000_000});
