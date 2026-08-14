import fs from 'node:fs/promises';
import pg from 'pg';

const { Client }=pg;
const file=process.argv[2];
if(!file)throw new Error('SQL verification file path is required');
const DATABASE_URL=process.env.DATABASE_URL;
if(!DATABASE_URL)throw new Error('DATABASE_URL is required');

function canonicalConnectionString(value){
 const url=new URL(value);
 url.searchParams.delete('sslmode');
 url.searchParams.delete('uselibpqcompat');
 return url.toString();
}

const sql=await fs.readFile(file,'utf8');
const ssl=process.env.DATABASE_SSL==='false'?false:{rejectUnauthorized:false};
const client=new Client({connectionString:canonicalConnectionString(DATABASE_URL),ssl});

try{
 await client.connect();
 const result=await client.query(sql);
 const last=Array.isArray(result)?result[result.length-1]:result;
 console.log(JSON.stringify({ok:true,file,result:last?.rows??[]},null,2));
}finally{
 await client.end();
}
