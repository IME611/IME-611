import pg from 'pg';
const { Pool } = pg;
let pool;
function getPool(){
  if(!process.env.DATABASE_URL) return null;
  if(!pool) pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==='false'?false:{rejectUnauthorized:false}});
  return pool;
}
async function ensureTable(db){await db.query(`CREATE TABLE IF NOT EXISTS knowledge_items (id BIGSERIAL PRIMARY KEY,title TEXT NOT NULL,kind TEXT NOT NULL DEFAULT 'ידע',created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)}
export default async function handler(req,res){
  const db=getPool();
  if(!db) return res.status(503).json({ok:false,error:'DATABASE_URL is not configured'});
  try{await ensureTable(db);
    if(req.method==='GET'){const {rows}=await db.query('SELECT id,title,kind,created_at FROM knowledge_items ORDER BY created_at DESC');return res.status(200).json({ok:true,items:rows});}
    if(req.method==='POST'){const title=String(req.body?.title||'').trim();if(!title)return res.status(400).json({ok:false,error:'title is required'});const {rows}=await db.query('INSERT INTO knowledge_items(title) VALUES($1) RETURNING id,title,kind,created_at',[title]);return res.status(201).json({ok:true,item:rows[0]});}
    if(req.method==='DELETE'){const id=Number(req.query?.id);if(!Number.isInteger(id))return res.status(400).json({ok:false,error:'id is required'});await db.query('DELETE FROM knowledge_items WHERE id=$1',[id]);return res.status(204).end();}
    res.setHeader('Allow','GET,POST,DELETE');return res.status(405).json({ok:false,error:'method not allowed'});
  }catch(error){console.error(error);return res.status(500).json({ok:false,error:'database error'});}
}
