import pg from 'pg';
const { Pool } = pg;
let pool;
export function getDb(){
  const connectionString=process.env.DATABASE_URL;
  if(!connectionString)throw new Error('DATABASE_URL is required');
  if(!pool){
    const ssl=process.env.DATABASE_SSL==='false'?false:{rejectUnauthorized:false};
    pool=new Pool({connectionString,ssl,max:5});
  }
  return pool;
}
