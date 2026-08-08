import pg from 'pg';
const { Pool } = pg;
let pool;
function getPool(){
  if(!process.env.DATABASE_URL) return null;
  if(!pool) pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==='false'?false:{rejectUnauthorized:false}});
  return pool;
}
async function ensureTable(db){await db.query(`CREATE TABLE IF NOT EXISTS knowledge_items (id BIGSERIAL PRIMARY KEY,title TEXT NOT NULL,kind TEXT NOT NULL DEFAULT 'ידע',content TEXT NOT NULL DEFAULT '',tags TEXT[] NOT NULL DEFAULT '{}',source TEXT NOT NULL DEFAULT '',created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)}
export default async function handler(req,res){
  const db=getPool(); if(!db)return res.status(503).json({ok:false,error:'DATABASE_URL is not configured'});
  try{await ensureTable(db);
    if(req.method==='GET'){const {rows}=await db.query('SELECT id,title,kind,content,tags,source,created_at,updated_at FROM knowledge_items ORDER BY updated_at DESC');return res.status(200).json({ok:true,items:rows});}
    if(req.method==='POST'){const b=req.body||{};const title=String(b.title||'').trim();if(!title)return res.status(400).json({ok:false,error:'title is required'});const {rows}=await db.query('INSERT INTO knowledge_items(title,kind,content,tags,source) VALUES($1,$2,$3,$4,$5) RETURNING *',[title,String(b.kind||'ידע'),String(b.content||''),Array.isArray(b.tags)?b.tags.map(String):[],String(b.source||'')]);return res.status(201).json({ok:true,item:rows[0]});}
    if(req.method==='PUT'){const id=Number(req.query?.id),b=req.body||{};if(!Number.isInteger(id))return res.status(400).json({ok:false,error:'id is required'});const title=String(b.title||'').trim();if(!title)return res.status(400).json({ok:false,error:'title is required'});const {rows}=await db.query('UPDATE knowledge_items SET title=$1,kind=$2,content=$3,tags=$4,source=$5,updated_at=NOW() WHERE id=$6 RETURNING *',[title,String(b.kind||'ידע'),String(b.content||''),Array.isArray(b.tags)?b.tags.map(String):[],String(b.source||''),id]);if(!rows[0])return res.status(404).json({ok:false,error:'item not found'});return res.status(200).json({ok:true,item:rows[0]});}
    if(req.method==='DELETE'){const id=Number(req.query?.id);if(!Number.isInteger(id))return res.status(400).json({ok:false,error:'id is required'});await db.query('DELETE FROM knowledge_items WHERE id=$1',[id]);return res.status(204).end();}
    res.setHeader('Allow','GET,POST,PUT,DELETE');return res.status(405).json({ok:false,error:'method not allowed'});
  }catch(error){console.error(error);return res.status(500).json({ok:false,error:'database error'});}
}
