import fs from'node:fs';
import os from'node:os';
import path from'node:path';

const safe=value=>String(value||'unknown').replace(/[^a-zA-Z0-9._-]+/g,'-').slice(0,160)||'unknown';

export function productionPreflightKey(env=process.env){
 return env.VERCEL_DEPLOYMENT_ID||env.VERCEL_GIT_COMMIT_SHA||env.VERCEL_URL||'local-production';
}

export function claimProductionPreflight({env=process.env,directory=os.tmpdir(),key=productionPreflightKey(env)}={}){
 if(env.VERCEL_ENV!=='production')return{run:true,reason:'non-production',lockPath:null};
 fs.mkdirSync(directory,{recursive:true});
 const lockPath=path.join(directory,`eil-production-preflight-${safe(key)}.lock`);
 try{
  const handle=fs.openSync(lockPath,'wx');
  fs.writeFileSync(handle,JSON.stringify({pid:process.pid,claimedAt:new Date().toISOString(),key:String(key)}));
  fs.closeSync(handle);
  return{run:true,reason:'claimed',lockPath};
 }catch(error){
  if(error?.code==='EEXIST')return{run:false,reason:'already-claimed',lockPath};
  throw error;
 }
}
