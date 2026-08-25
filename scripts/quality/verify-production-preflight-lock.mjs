import assert from'node:assert/strict';
import fs from'node:fs';
import os from'node:os';
import path from'node:path';
import{claimProductionPreflight,productionPreflightKey}from'./production-preflight-lock.mjs';

const directory=fs.mkdtempSync(path.join(os.tmpdir(),'eil-preflight-lock-test-'));
try{
 const productionEnv={VERCEL_ENV:'production',VERCEL_GIT_COMMIT_SHA:'commit-a'};
 assert.equal(productionPreflightKey(productionEnv),'commit-a');
 const first=claimProductionPreflight({env:productionEnv,directory});
 const second=claimProductionPreflight({env:productionEnv,directory});
 const nextDeployment=claimProductionPreflight({env:{VERCEL_ENV:'production',VERCEL_GIT_COMMIT_SHA:'commit-b'},directory});
 const preview=claimProductionPreflight({env:{VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_SHA:'commit-a'},directory});
 assert.equal(first.run,true,'first production build unit must own remote preflight');
 assert.equal(first.reason,'claimed');
 assert.equal(second.run,false,'later build units for the same deployment must skip duplicate remote preflight');
 assert.equal(second.reason,'already-claimed');
 assert.equal(nextDeployment.run,true,'a different deployment/commit must get its own remote preflight');
 assert.equal(preview.run,true,'preview/local builds must not be gated by a production lock');
 assert.equal(preview.lockPath,null,'preview/local builds must not create production lock files');
 console.log('PASS production preflight lock (same deployment runs remote preflight once; new deployment remains independent)');
}finally{
 fs.rmSync(directory,{recursive:true,force:true});
}
