import pg from 'pg';
const { Pool } = pg;
let pool;

export function normalizeDatabaseUrl(value){
  const url=new URL(value);
  url.searchParams.delete('sslmode');
  url.searchParams.delete('uselibpqcompat');
  return url.toString();
}

export function getDb(){
  const connectionString=process.env.DATABASE_URL;
  if(!connectionString)throw new Error('DATABASE_URL is required');
  if(!pool){
    const ssl=process.env.DATABASE_SSL==='false'?false:{rejectUnauthorized:false};
    pool=new Pool({
      connectionString:normalizeDatabaseUrl(connectionString),
      ssl,
      max:5,
      idleTimeoutMillis:10_000,
      connectionTimeoutMillis:4_000,
      allowExitOnIdle:true,
    });
  }
  return pool;
}
