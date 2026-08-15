import fs from'node:fs/promises';
import crypto from'node:crypto';
import pg from'pg';

const{Client}=pg;
const DATABASE_URL=process.env.DATABASE_URL;
if(!DATABASE_URL)throw new Error('DATABASE_URL is required');
const MIGRATION='database/migrations/007_intake_submissions.sql';
const sha256=value=>crypto.createHash('sha256').update(value).digest('hex');
function connectionString(value){const url=new URL(value);url.searchParams.delete('sslmode');url.searchParams.delete('uselibpqcompat');return url.toString()}
const client=new Client({connectionString:connectionString(DATABASE_URL),ssl:process.env.DATABASE_SSL==='false'?false:{rejectUnauthorized:false}});

try{
 await client.connect();
 await client.query("SELECT pg_advisory_lock(hashtext('eil_live_migrations'))");
 await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations(name TEXT PRIMARY KEY,checksum CHAR(64) NOT NULL,applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
 const sql=await fs.readFile(MIGRATION,'utf8'),checksum=sha256(sql),existing=(await client.query('SELECT checksum FROM schema_migrations WHERE name=$1',[MIGRATION])).rows[0];
 if(existing){
  if(existing.checksum!==checksum)throw new Error(`Migration drift detected for ${MIGRATION}`);
  console.log(`SKIP ${MIGRATION} (already applied)`);
 }else{
  console.log(`APPLY ${MIGRATION}`);await client.query(sql);await client.query('INSERT INTO schema_migrations(name,checksum) VALUES($1,$2)',[MIGRATION,checksum]);console.log(`OK ${MIGRATION}`);
 }
}finally{
 try{await client.query("SELECT pg_advisory_unlock(hashtext('eil_live_migrations'))")}catch{}
 await client.end();
}
